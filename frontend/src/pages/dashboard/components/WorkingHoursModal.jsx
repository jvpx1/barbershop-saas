// src/pages/dashboard/components/WorkingHoursModal.jsx
import { useState } from "react";
import Modal from "../../../components/Modal.jsx";
import { api } from "../../../lib/api.js";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function WorkingHoursModal({ isOpen, onClose, barber, onSaved }) {
  const [hours, setHours] = useState(
    barber.workingHours?.map((h) => ({
      weekday: h.weekday,
      startTime: h.startTime,
      endTime: h.endTime,
    })) || []
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function addSlot() {
    setHours([...hours, { weekday: 1, startTime: "09:00", endTime: "18:00" }]);
  }

  function removeSlot(index) {
    setHours(hours.filter((_, i) => i !== index));
  }

  function updateSlot(index, field, value) {
    const newHours = [...hours];
    newHours[index][field] = value;
    setHours(newHours);
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      await api(`/api/barbers/${barber.id}/working-hours`, {
        method: "PUT",
        body: { hours },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Horários de ${barber.name}`}>
      <div className="space-y-4">
        {hours.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum horário definido. Adicione um abaixo.</p>
        ) : (
          <div className="space-y-2">
            {hours.map((h, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={h.weekday}
                  onChange={(e) => updateSlot(index, "weekday", Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
                >
                  {WEEKDAYS.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={h.startTime}
                  onChange={(e) => updateSlot(index, "startTime", e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
                />
                <span className="text-slate-500">às</span>
                <input
                  type="time"
                  value={h.endTime}
                  onChange={(e) => updateSlot(index, "endTime", e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white"
                />
                <button onClick={() => removeSlot(index)} className="ml-2 text-red-400 hover:text-red-300">✕</button>
              </div>
            ))}
          </div>
        )}

        <button onClick={addSlot} className="text-sm font-medium text-blue-400 hover:text-blue-300">
          + Adicionar horário
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 disabled:opacity-50">
            {loading ? "Salvando..." : "Salvar Horários"}
          </button>
        </div>
      </div>
    </Modal>
  );
}