import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { formatPrice } from "../../lib/format.js";
import Modal from "../../components/Modal.jsx";

export default function ServicosPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ name: "", price: "", durationMinutes: "" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função auxiliar para carregar após uma ação (criar/editar/excluir)
  async function loadServices() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/services");
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // useEffect para a carga inicial (corrigido sem setState direto)
  useEffect(() => {
    let ignore = false;
    
    async function fetchServices() {
      try {
        const data = await api("/api/services");
        if (!ignore) {
          setServices(data);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchServices();
    return () => { ignore = true; };
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: "", price: "", durationMinutes: "" });
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      price: String(service.price),
      durationMinutes: String(service.durationMinutes),
    });
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const payload = {
      name: form.name,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
    };

    try {
      if (editingId) {
        await api(`/api/services/${editingId}`, { method: "PUT", body: payload });
      } else {
        await api("/api/services", { method: "POST", body: payload });
      }
      setIsModalOpen(false);
      await loadServices(); // Recarrega a lista após salvar
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(service) {
    try {
      if (service.active) {
        await api(`/api/services/${service.id}`, { method: "DELETE" });
      } else {
        await api(`/api/services/${service.id}`, { method: "PUT", body: { active: true } });
      }
      await loadServices(); // Recarrega a lista após mudar o status
    } catch (err) {
      alert("Erro ao alterar status: " + err.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Serviços</h1>
          <p className="text-sm text-slate-400">Gerencie os serviços da sua barbearia.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 sm:w-auto"
        >
          + Novo Serviço
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-900 bg-red-950/50 p-3 text-red-400">{error}</p>}

      {loading ? (
        <p className="text-slate-400">Carregando serviços...</p>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          Nenhum serviço cadastrado ainda.
        </div>
      ) : (
        <>
          {/* VISUAL DESKTOP (TABELA) */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-800 bg-[#15171C] shadow-sm md:block">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-[#101115] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Preço</th>
                  <th className="px-6 py-3">Duração</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {services.map((s) => (
                  <tr key={s.id} className={s.active ? "hover:bg-white/[0.02]" : "opacity-50 hover:bg-white/[0.02]"}>
                    <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                    <td className="text-lg text-amber-400">{formatPrice(s.price)}</td>
                    <td className="px-6 py-4">{s.durationMinutes} min</td>
                    <td className="px-6 py-4">
                      {s.active ? (
                        <span className="rounded-full border border-emerald-900/50 bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">Ativo</span>
                      ) : (
                        <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">Inativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button onClick={() => openEditModal(s)} className="font-medium text-blue-400 hover:text-blue-300">Editar</button>
                      <button onClick={() => toggleStatus(s)} className="font-medium text-red-400 hover:text-red-300">
                        {s.active ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VISUAL MOBILE (CARDS) */}
          <div className="space-y-3 md:hidden">
            {services.map((s) => (
              <div key={s.id} className={`rounded-xl border border-slate-800 bg-[#15171C] p-4 ${!s.active ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{s.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{s.durationMinutes} min</p>
                  </div>
                  {s.active ? (
                    <span className="rounded-full border border-emerald-900/50 bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400">Ativo</span>
                  ) : (
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">Inativo</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-800/50 pt-3">
                  <span className="text-lg font-semibold text-amber-400">{formatPrice(s.price)}</span>
                  <div className="flex gap-4">
                    <button onClick={() => openEditModal(s)} className="text-sm font-medium text-blue-400">Editar</button>
                    <button onClick={() => toggleStatus(s)} className="text-sm font-medium text-red-400">
                      {s.active ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Serviço" : "Novo Serviço"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Nome do serviço</label>
            <input
              required minLength={2} placeholder="Ex: Corte degradê"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Preço (R$)</label>
              <input
                required type="number" step="0.01" min="0" placeholder="35.00"
                value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Duração (min)</label>
              <input
                required type="number" min="5" max="480" placeholder="30"
                value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50">
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}