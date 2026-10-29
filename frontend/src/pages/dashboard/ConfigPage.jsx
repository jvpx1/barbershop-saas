// src/pages/dashboard/ConfigPage.jsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { formatPhone } from "../../lib/format.js";

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    primaryColor: "#111827",
    phone: "",
    address: "",
    timezone: "",
  });

  // Busca os dados atuais da barbearia
  useEffect(() => {
    let ignore = false;

    api("/api/barbershop")
      .then((data) => {
        if (!ignore) {
          setForm({
            name: data.name || "",
            logoUrl: data.logoUrl || "",
            primaryColor: data.primaryColor || "#111827",
            phone: data.phone || "",
            address: data.address || "",
            timezone: data.timezone || "America/Manaus",
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { ignore = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    // Prepara o payload, limpando os opcionais vazios
    const payload = {
      name: form.name,
      primaryColor: form.primaryColor,
      timezone: form.timezone,
      logoUrl: form.logoUrl.trim() === "" ? null : form.logoUrl,
      phone: form.phone.trim() === "" ? null : form.phone.replace(/\D/g, ""), // Remove a máscara
      address: form.address.trim() === "" ? null : form.address,
    };

    try {
      const updated = await api("/api/barbershop", {
        method: "PATCH",
        body: payload,
      });

      // Atualiza a máscara de telefone visualmente
      setForm((prev) => ({ ...prev, phone: formatPhone(updated.phone || "") }));
      setSuccess("Configurações salvas com sucesso!");
      
      // Limpa a mensagem de sucesso depois de 3 segundos
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <p className="text-slate-400">Carregando configurações...</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-slate-400">Ajuste a identidade e os dados de contato da sua barbearia.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
        
        {/* IDENTIDADE */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Identidade Visual</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Nome da Barbearia</label>
              <input
                required minLength={2}
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">URL do Logo</label>
              <input
                type="url" placeholder="https://..."
                value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Cor Principal</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded border border-slate-700 bg-slate-800 p-1"
                />
                <span className="text-sm text-slate-400 uppercase">{form.primaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTATO E LOCALIZAÇÃO */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Contato e Localização</h2>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Telefone</label>
              <input
                inputMode="tel" placeholder="(00) 00000-0000"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Fuso Horário</label>
              <select
                value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-slate-500 focus:outline-none"
              >
                <option value="America/Manaus">Manaus (AM)</option>
                <option value="America/Sao_Paulo">São Paulo (SP)</option>
                <option value="America/Rio_Branco">Rio Branco (AC)</option>
                <option value="America/Belem">Belém (PA)</option>
                <option value="America/Cuiaba">Cuiabá (MT)</option>
                <option value="America/Recife">Recife (PE)</option>
                <option value="America/Fortaleza">Fortaleza (CE)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Endereço</label>
            <input
              placeholder="Rua, número, bairro"
              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-950/50 border border-red-900 p-3 text-sm text-red-400">{error}</p>}
        {success && <p className="rounded-lg bg-emerald-950/50 border border-emerald-900 p-3 text-sm text-emerald-400">{success}</p>}

        <div className="flex justify-end pt-4">
          <button
            type="submit" disabled={isSubmitting}
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50"
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}