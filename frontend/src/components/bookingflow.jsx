// src/components/bookingflow.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import {
  formatLongDate,
  formatPhone,
  formatPrice,
  todayInZone,
} from "../lib/format.js";

function period(time) {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "Manhã";
  if (hour < 18) return "Tarde";
  return "Noite";
}

function Step({ number, title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-400">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function BookingFlow({ barbershop }) {
  const color = barbershop.primaryColor;
  const today = todayInZone(barbershop.timezone);
  
  // Estilo aplicado aos botões selecionados
  const selectedStyle = { 
    backgroundColor: color, 
    borderColor: color, 
    color: "#fff",
    boxShadow: `0 0 15px ${color}40` // Dá um brilho na cor da barbearia
  };

  const [serviceId, setServiceId] = useState(null);
  const [barberId, setBarberId] = useState(null);
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [slotsResult, setSlotsResult] = useState({ key: null, slots: [], error: "" });
  const [form, setForm] = useState({ name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const service = barbershop.services.find((s) => s.id === serviceId);
  const barber = barbershop.barbers.find((b) => b.id === barberId);

  const slotsKey =
    serviceId && barberId && date ? `${serviceId}|${barberId}|${date}|${refresh}` : null;

  useEffect(() => {
    if (!slotsKey) return;
    let ignore = false;

    const params = new URLSearchParams({ barberId, serviceId, date });

    api(`/api/public/${barbershop.slug}/availability?${params}`)
      .then((slots) => {
        if (!ignore) setSlotsResult({ key: slotsKey, slots, error: "" });
      })
      .catch((err) => {
        if (!ignore) setSlotsResult({ key: slotsKey, slots: [], error: err.message });
      });

    return () => {
      ignore = true;
    };
  }, [slotsKey, barberId, serviceId, date, barbershop.slug]);

  const loadingSlots = slotsKey !== null && slotsResult.key !== slotsKey;
  const slots = slotsResult.key === slotsKey ? slotsResult.slots : [];
  const slotsError = slotsResult.key === slotsKey ? slotsResult.error : "";

  const groups = ["Manhã", "Tarde", "Noite"]
    .map((name) => ({ name, items: slots.filter((s) => period(s.time) === name) }))
    .filter((g) => g.items.length > 0);

  function chooseService(id) { setServiceId(id); setSlot(null); }
  function chooseBarber(id) { setBarberId(id); setSlot(null); }
  function chooseDate(value) { setDate(value); setSlot(null); }

  function reset() {
    setServiceId(null);
    setBarberId(null);
    setDate(today);
    setSlot(null);
    setForm({ name: "", phone: "" });
    setSubmitError("");
    setConfirmed(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      await api(`/api/public/${barbershop.slug}/appointments`, {
        method: "POST",
        body: {
          barberId,
          serviceId,
          customerName: form.name,
          customerPhone: form.phone,
          startsAt: slot.startsAt,
        },
      });

      setConfirmed({ service, barber, date, time: slot.time });
    } catch (err) {
      setSubmitError(err.message);
      if (err.status === 409) {
        setSlot(null);
        setRefresh((r) => r + 1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <section className="mt-8 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          ✓
        </div>
        <h2 className="text-xl font-bold text-white">Agendamento confirmado!</h2>
        <p className="mt-3 text-lg text-slate-300">
          {confirmed.service.name} com <strong className="text-white">{confirmed.barber.name}</strong>
        </p>
        <p className="text-slate-300">
          {formatLongDate(confirmed.date)} às {confirmed.time}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {barbershop.name}
          {barbershop.address ? ` · ${barbershop.address}` : ""}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Fazer outro agendamento
        </button>
      </section>
    );
  }

  return (
    <div className="mt-6 space-y-8 pb-12">
      <Step number="1" title="Escolha o serviço">
        <ul className="space-y-2">
          {barbershop.services.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => chooseService(s.id)}
                style={serviceId === s.id ? selectedStyle : undefined}
                className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-slate-600"
              >
                <div>
                  <span className="font-medium text-white">{s.name}</span>
                  <span className="ml-2 text-sm text-slate-400">{s.durationMinutes} min</span>
                </div>
                <span className="font-medium text-white">{formatPrice(s.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Step>

      {serviceId && (
        <Step number="2" title="Escolha o barbeiro">
          <div className="flex flex-wrap gap-2">
            {barbershop.barbers.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => chooseBarber(b.id)}
                style={barberId === b.id ? selectedStyle : undefined}
                className="rounded-full border border-slate-800 bg-slate-900 px-5 py-2.5 text-sm text-slate-300 transition hover:border-slate-600"
              >
                {b.name}
              </button>
            ))}
          </div>
        </Step>
      )}

      {serviceId && barberId && (
        <Step number="3" title="Escolha o dia">
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => chooseDate(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-slate-600 [color-scheme:dark]"
          />
          {date && <p className="mt-3 text-sm font-medium text-slate-400 capitalize">{formatLongDate(date)}</p>}
        </Step>
      )}

      {slotsKey && (
        <Step number="4" title="Escolha o horário">
          {loadingSlots && <p className="text-slate-400">Buscando horários...</p>}
          {slotsError && <p className="text-red-400">{slotsError}</p>}
          {!loadingSlots && !slotsError && groups.length === 0 && (
            <p className="rounded-lg bg-slate-900 p-4 text-center text-slate-400">
              Nenhum horário disponível neste dia. Tente outra data.
            </p>
          )}
          {groups.map((group) => (
            <div key={group.name} className="mb-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{group.name}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((s) => (
                  <button
                    key={s.startsAt}
                    type="button"
                    onClick={() => setSlot(s)}
                    style={slot?.startsAt === s.startsAt ? selectedStyle : undefined}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:border-slate-600"
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Step>
      )}

      {slot && (
        <Step number="5" title="Seus dados">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              Resumo: <strong className="text-white">{service.name}</strong> com <strong className="text-white">{barber.name}</strong>, {formatLongDate(date)} às {slot.time}
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Nome completo</label>
              <input
                required minLength={2} maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Como devemos te chamar?"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">WhatsApp</label>
              <input
                required inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-slate-500"
              />
            </div>
            {submitError && <p className="text-sm text-red-400 bg-red-950/30 p-2 rounded border border-red-900">{submitError}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: color }}
              className="mt-2 w-full rounded-xl px-4 py-4 font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "Confirmando..." : "Confirmar agendamento"}
            </button>
          </form>
        </Step>
      )}
    </div>
  );
}