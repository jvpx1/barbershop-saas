import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";
import { PageHeader, SectionCard, StatCard } from "../../components/ui.jsx";

export default function FinancasPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Busca os agendamentos dos últimos 30 dias
  useEffect(() => {
    let active = true;
    
    // Pega a data de 30 dias atrás no formato AAAA-MM-DD
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    async function fetchFinancas() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          date: dateStr,
          days: "31", // Pega 31 dias pra garantir
          limit: "100", // Limite máximo do backend
        });
        const res = await api(`/api/appointments?${params.toString()}`);
        
        if (!active) return;
        setAppointments(res.data || []);
      } catch (err) {
        if (!active) return;
        setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchFinancas();
    return () => { active = false; };
  }, []);

  // Calcula os totais usando useMemo (só recalcula se appointments mudar)
  const stats = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    let doneCount = 0;

    const dailyRevenue = {}; // Para o gráfico

    appointments.forEach((apt) => {
      // O preço vem do backend como string "35.00", precisamos converter
      const price = Number(apt.service?.price) || 0;
      
      // Pega o dia (AAAA-MM-DD) baseado no horário local
      const dateObj = new Date(apt.startsAt);
      const dayStr = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

      if (apt.status === "DONE") {
        revenue += price;
        doneCount++;
        dailyRevenue[dayStr] = (dailyRevenue[dayStr] || 0) + price;
      } else if (apt.status === "CONFIRMED") {
        pending += price;
      }
    });

    // Pega os últimos 7 dias para o gráfico
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      return { label: dayStr, value: dailyRevenue[dayStr] || 0 };
    });

    const maxValue = Math.max(...last7Days.map(d => d.value), 1); // Evita divisão por zero

    return {
      revenue,
      pending,
      doneCount,
      averageTicket: doneCount > 0 ? revenue / doneCount : 0,
      last7Days,
      maxValue,
    };
  }, [appointments]);

  // Filtra só os concluídos pra tabela, ordenando do mais recente pro mais antigo
  const doneAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.status === "DONE")
      .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  }, [appointments]);

  if (loading) return <p className="text-slate-400">Carregando dados financeiros...</p>;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 text-slate-200">
      <PageHeader
        eyebrow="Financeiro"
        title="Finanças"
        description="Acompanhe o faturamento e os agendamentos concluídos dos últimos 30 dias."
      />

      {error && <p className="rounded-lg bg-red-950/50 border border-red-900 p-3 text-red-400">{error}</p>}

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard 
          label="Faturamento Realizado" 
          value={formatPrice(stats.revenue)} 
          caption={`${stats.doneCount} atendimentos concluídos`} 
          symbol="R$" 
          accent="green" 
        />
        <StatCard 
          label="A Receber (Agendado)" 
          value={formatPrice(stats.pending)} 
          caption="Atendimentos confirmados" 
          symbol="◷" 
          accent="amber" 
        />
        <StatCard 
          label="Ticket Médio" 
          value={formatPrice(stats.averageTicket)} 
          caption="Por atendimento concluído" 
          symbol="Ø" 
          accent="blue" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO DE BARRAS SIMPLES (Últimos 7 dias) */}
        <SectionCard title="Faturamento Recente" subtitle="Últimos 7 dias">
          <div className="p-6">
            <div className="flex items-end justify-between gap-2 h-48">
              {stats.last7Days.map((day) => (
                <div key={day.label} className="flex flex-col items-center flex-1 gap-2 group">
                  <div className="w-full relative flex justify-center items-end h-full">
                    {/* A barra em si */}
                    <div 
                      className="w-full max-w-[40px] rounded-t-md bg-emerald-500/20 border-t-2 border-emerald-500 transition-all group-hover:bg-emerald-500/40"
                      style={{ height: `${(day.value / stats.maxValue) * 100}%`, minHeight: '4px' }}
                    />
                    {/* Tooltip que aparece no hover */}
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 pointer-events-none transition-opacity">
                      {formatPrice(day.value)}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* TABELA DE CONCLUÍDOS */}
        <SectionCard title="Últimos Atendimentos Concluídos" subtitle={`${doneAppointments.length} registros`}>
          {doneAppointments.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Nenhum atendimento concluído no período.</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="sticky top-0 bg-[#15171C] border-b border-white/[0.06] text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Serviço</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {doneAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {new Date(apt.startsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[120px] font-medium text-white">{apt.customerName}</td>
                      <td className="px-4 py-3 truncate max-w-[120px]">{apt.service.name}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-400">
                        {formatPrice(apt.service.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}