// src/pages/dashboard/BarbeirosPage.jsx
import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import Modal from "../../components/Modal.jsx";
import WorkingHoursModal from "./components/WorkingHoursModal.jsx";

export default function BarbeirosPage() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", photoUrl: "" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);

  async function fetchBarbers() {
    try {
      const data = await api("/api/barbers");
      setBarbers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    api("/api/barbers")
      .then((data) => {
        if (!ignore) {
          setBarbers(data);
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

  async function loadBarbers() {
    setLoading(true);
    await fetchBarbers();
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: "", photoUrl: "" });
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(barber) {
    setEditingId(barber.id);
    setForm({ name: barber.name, photoUrl: barber.photoUrl || "" });
    setFormError("");
    setIsModalOpen(true);
  }

  function openHoursModal(barber) {
    setSelectedBarber(barber);
    setIsHoursModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const payload = {
      name: form.name,
      photoUrl: form.photoUrl.trim() === "" ? null : form.photoUrl,
    };

    try {
      if (editingId) {
        await api(`/api/barbers/${editingId}`, { method: "PUT", body: payload });
      } else {
        await api("/api/barbers", { method: "POST", body: payload });
      }
      setIsModalOpen(false);
      await loadBarbers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(barber) {
    try {
      if (barber.active) {
        await api(`/api/barbers/${barber.id}`, { method: "DELETE" });
      } else {
        await api(`/api/barbers/${barber.id}`, { method: "PUT", body: { active: true } });
      }
      await loadBarbers();
    } catch (err) {
      alert("Erro ao alterar status: " + err.message);
    }
  }

  // Função para apagar de vez (Hard Delete). Vai num botão dentro do Modal de Edição.
  async function handleHardDelete() {
    const confirmDelete = window.confirm(
      "Tem certeza absoluta que deseja EXCLUIR este barbeiro? Essa ação apagará o registro e não poderá ser desfeita. Se ele apenas tirou férias ou está doente, prefira 'Desativar'."
    );
    if (!confirmDelete) return;

    try {
      // O backend atual usa DELETE para soft delete (active: false). 
      // Como não temos uma rota de hard delete, essa ação vai apenas inativar ele e fechar o modal.
      await api(`/api/barbers/${editingId}`, { method: "DELETE" });
      setIsModalOpen(false);
      await loadBarbers();
    } catch (err) {
      alert("Erro ao excluir barbeiro: " + err.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Barbeiros</h1>
          <p className="text-sm text-slate-400">Gerencie sua equipe e os horários de trabalho.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
        >
          + Novo Barbeiro
        </button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-950/50 border border-red-900 p-3 text-red-400">{error}</p>}

      {loading ? (
        <p className="text-slate-400">Carregando barbeiros...</p>
      ) : barbers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          Nenhum barbeiro cadastrado ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {barbers.map((b) => (
                <tr key={b.id} className={b.active ? "hover:bg-slate-800/30" : "opacity-50 hover:bg-slate-800/30"}>
                  <td className="flex items-center gap-3 px-6 py-4 font-medium text-white">
                    {b.photoUrl ? (
                      <img src={b.photoUrl} alt={b.name} className="h-8 w-8 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs">👤</div>
                    )}
                    {b.name}
                  </td>
                  <td className="px-6 py-4">
                    {b.active ? (
                      <span className="rounded-full bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-900/50">Ativo</span>
                    ) : (
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400 border border-slate-700">Inativo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => openHoursModal(b)} className="font-medium text-amber-400 hover:text-amber-300">Horários</button>
                    <button onClick={() => openEditModal(b)} className="font-medium text-blue-400 hover:text-blue-300">Editar</button>
                    <button onClick={() => toggleStatus(b)} className="font-medium text-red-400 hover:text-red-300">
                      {b.active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CRIAR/EDITAR BARBEIRO */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Barbeiro" : "Novo Barbeiro"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Nome do barbeiro</label>
            <input
              required minLength={2} placeholder="Ex: João Silva"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">URL da Foto (Opcional)</label>
            <input
              type="url" placeholder="https://exemplo.com/foto.jpg"
              value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-slate-500 focus:outline-none"
            />
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          
          {/* BOTÃO DE EXCLUIR DENTRO DO MODAL */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            {editingId ? (
              <button
                type="button"
                onClick={handleHardDelete}
                className="text-sm font-medium text-red-400 hover:text-red-300 hover:underline"
              >
                Excluir Barbeiro
              </button>
            ) : <div />}
            
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50">
                {isSubmitting ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {selectedBarber && (
        <WorkingHoursModal
          isOpen={isHoursModalOpen}
          onClose={() => setIsHoursModalOpen(false)}
          barber={selectedBarber}
          onSaved={loadBarbers}
        />
      )}
    </div>
  );
}