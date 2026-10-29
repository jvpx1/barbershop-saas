import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { formatPhone } from "../../lib/format.js";
import Modal from "../../components/Modal.jsx";
import DailyGrid from "./components/DailyGrid.jsx";
import {
  FilterSelect,
  IconButton,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from "../../components/ui.jsx";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "DONE", label: "Concluídos" },
  { value: "CANCELLED", label: "Cancelados" },
];

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEndTime(appointment) {
  const start = new Date(appointment.startsAt);
  const duration = Number(appointment.service?.durationMinutes) || 0;
  return new Date(start.getTime() + duration * 60_000);
}

function getAppointmentSearchText(appointment) {
  return [
    appointment.customerName,
    appointment.customerPhone,
    appointment.barber?.name,
    appointment.service?.name,
  ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] text-2xl text-amber-400">
        ◷
      </span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => localDateString());
  
  const [barberId, setBarberId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);

  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [barbers, setBarbers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Lógica dos dias da semana
  const weekDays = useMemo(() => {
    const start = addDays(currentDate, -currentDate.getDay()); // Domingo
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  // Carrega barbeiros
  useEffect(() => {
    let ignore = false;
    async function loadBarbers() {
      try {
        const data = await api("/api/barbers");
        if (!ignore) setBarbers(data);
      } catch {
        if (!ignore) setBarbers([]);
      }
    }
    loadBarbers();
    return () => { ignore = true; };
  }, []);

  // Carrega agendamentos do dia selecionado
  useEffect(() => {
    let active = true;
    async function fetchAgenda() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        date: selectedDate,
        days: "1",
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (barberId) params.set("barberId", barberId);

      try {
        const result = await api(`/api/appointments?${params.toString()}`);
        if (!active) return;
        setAppointments(result.data);
        setPagination(result.pagination);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Não foi possível carregar a agenda.");
        setAppointments([]);
        setPagination(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchAgenda();
    return () => { active = false; };
  }, [selectedDate, barberId, page, refreshKey]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return appointments.filter((appointment) => {
      const matchesStatus = !status || appointment.status === status;
      const matchesSearch = !query || getAppointmentSearchText(appointment).includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [appointments, search, status]);

  const counts = useMemo(
    () => ({
      confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
      done: appointments.filter((a) => a.status === "DONE").length,
      cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
    }),
    [appointments]
  );

  function changeWeek(amount) {
    setCurrentDate(addDays(currentDate, amount * 7));
  }

  async function handleStatusChange(appointment, nextStatus) {
    const isConfirm = nextStatus === "DONE";
    
    const confirmed = window.confirm(
      isConfirm
        ? `Você deseja marcar o atendimento de ${appointment.customerName} como CONCLUÍDO?`
        : `Atenção: Você deseja CANCELAR o agendamento de ${appointment.customerName}? Essa ação liberará o horário.`
    );
    
    if (!confirmed) return;

    setBusyId(appointment.id);
    setNotice("");
    setError("");

    try {
      await api(`/api/appointments/${appointment.id}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setNotice(isConfirm ? "Atendimento concluído!" : "Agendamento cancelado.");
      
      if (selectedAppointment?.id === appointment.id) {
        setSelectedAppointment((prev) => ({ ...prev, status: nextStatus }));
      }
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err.message || "Erro ao atualizar o agendamento.");
    } finally {
      setBusyId(null);
    }
  }

  const today = localDateString();
  const total = pagination?.total ?? appointments.length;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 text-slate-200">
      <PageHeader
        eyebrow="Operação"
        title="Agenda"
        description="Acompanhe os atendimentos e organize o dia da barbearia."
      />

      {/* BARRA DE DIAS DA SEMANA */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#15171C] p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconButton label="Semana anterior" onClick={() => changeWeek(-1)}>←</IconButton>
            <IconButton label="Próxima semana" onClick={() => changeWeek(1)}>→</IconButton>
            <button
              type="button"
              onClick={() => { setCurrentDate(new Date()); setSelectedDate(today); setPage(1); }}
              className="ml-2 rounded-xl border border-white/[0.08] px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-amber-400/30 hover:text-amber-300"
            >
              Hoje
            </button>
          </div>
          <p className="text-sm font-medium text-slate-400 capitalize hidden sm:block">
            {formatDate(selectedDate)}
          </p>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => {
            const dateStr = localDateString(day);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => { setSelectedDate(dateStr); setPage(1); }}
                className={`flex flex-col items-center justify-center rounded-xl border p-2 transition sm:p-3 ${
                  isSelected 
                    ? "border-amber-400/50 bg-amber-400/10" 
                    : "border-transparent bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${
                  isSelected ? "text-amber-400" : "text-slate-500"
                }`}>
                  {day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                </span>
                <span className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  isToday 
                    ? "bg-amber-500 text-black" 
                    : isSelected 
                      ? "text-white" 
                      : "text-slate-300"
                }`}>
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={total} caption="Agendamentos no dia" symbol="◷" accent="amber" />
        <StatCard label="Confirmados" value={counts.confirmed} caption="Aguardando" symbol="◉" accent="blue" />
        <StatCard label="Concluídos" value={counts.done} caption="Finalizados" symbol="✓" accent="green" />
        <StatCard label="Cancelados" value={counts.cancelled} caption="Desmarcados" symbol="×" accent="red" />
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm text-emerald-300">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Fechar">×</button>
        </div>
      )}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Fechar">×</button>
        </div>
      )}

      <SectionCard
        title="Atendimentos"
        subtitle={`${filteredAppointments.length} resultado(s) nesta página`}
        action={
          <div className="flex rounded-xl border border-white/[0.08] bg-[#101115] p-1">
            <button
              type="button" 
              onClick={() => setView("list")}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                view === "list" ? "bg-amber-400 text-[#17130B]" : "text-slate-400 hover:text-white"
              }`}
            >
              Lista
            </button>
            <button
              type="button" 
              onClick={() => setView("calendar")}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                view === "calendar" ? "bg-amber-400 text-[#17130B]" : "text-slate-400 hover:text-white"
              }`}
            >
              Grade
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 border-b border-white/[0.06] p-4 md:grid-cols-3">
          {/* LUPA CORRIGIDA */}
          <div className="relative md:col-span-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, telefone..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#101115] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-500/50"
            />
          </div>

          <FilterSelect
            label="Barbeiro" value={barberId}
            onChange={(value) => { setBarberId(value); setPage(1); }}
            options={[{ value: "", label: "Todos os barbeiros" }, ...barbers.map(b => ({ value: String(b.id), label: b.name }))]}
          />
          <FilterSelect
            label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS}
          />
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            <div className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
            <p className="text-center text-xs text-slate-500">Carregando...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            title="Nenhum agendamento encontrado"
            description={search || status ? "Tente alterar a busca ou os filtros." : "Não há agendamentos para esta data."}
          />
        ) : view === "list" ? (
          <div className="space-y-3 p-3 sm:p-4">
            {[...filteredAppointments].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)).map((appointment) => (
              <div
                key={appointment.id}
                onClick={() => setSelectedAppointment(appointment)}
                className="group cursor-pointer rounded-xl border border-white/[0.07] bg-[#191B21] p-4 transition hover:border-amber-400/20 hover:bg-[#1C1E24]"
              >
                <div className="flex gap-3">
                  <div className="flex w-[60px] shrink-0 flex-col items-center justify-center self-start rounded-lg border border-amber-400/15 bg-amber-400/[0.05] px-1 py-2">
                    <span className="text-sm font-semibold tabular-nums text-amber-300">{formatTime(appointment.startsAt)}</span>
                    <span className="mt-1 text-[10px] text-slate-500">{appointment.service?.durationMinutes} min</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-white">{appointment.customerName}</h3>
                        <p className="mt-1 text-xs text-slate-500">{appointment.service?.name}</p>
                      </div>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
                      <span>♧ {appointment.barber?.name}</span>
                      <span>{formatPhone(appointment.customerPhone)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DailyGrid
            appointments={filteredAppointments}
            barbers={barbers.filter((b) => !barberId || String(b.id) === barberId)}
            onSelectAppointment={setSelectedAppointment}
          />
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-white/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Página {pagination.page} de {pagination.totalPages} · {pagination.total} agendamento(s)</p>
            <div className="flex gap-2">
              <button type="button" disabled={!pagination.hasPrev || loading} onClick={() => setPage((c) => c - 1)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04] disabled:opacity-30">
                Anterior
              </button>
              <button type="button" disabled={!pagination.hasNext || loading} onClick={() => setPage((c) => c + 1)} className="rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.04] disabled:opacity-30">
                Próxima
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* MODAL DE DETALHES */}
      <Modal 
        isOpen={!!selectedAppointment} 
        onClose={() => setSelectedAppointment(null)}
        title="Detalhes do Agendamento"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedAppointment.customerName}</h3>
                <p className="text-sm text-slate-400">{formatPhone(selectedAppointment.customerPhone)}</p>
              </div>
              <StatusBadge status={selectedAppointment.status} />
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-2">
              <p className="flex justify-between text-sm">
                <span className="text-slate-400">Serviço:</span>
                <span className="text-white font-medium">{selectedAppointment.service.name}</span>
              </p>
              <p className="flex justify-between text-sm">
                <span className="text-slate-400">Barbeiro:</span>
                <span className="text-white font-medium">{selectedAppointment.barber.name}</span>
              </p>
              <p className="flex justify-between text-sm">
                <span className="text-slate-400">Horário:</span>
                <span className="text-white font-medium">
                  {formatTime(selectedAppointment.startsAt)} às {formatTime(getEndTime(selectedAppointment))}
                </span>
              </p>
            </div>

            {selectedAppointment.status === "CONFIRMED" && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleStatusChange(selectedAppointment, "DONE")}
                  disabled={busyId === selectedAppointment.id}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Concluir Atendimento
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAppointment, "CANCELLED")}
                  disabled={busyId === selectedAppointment.id}
                  className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}