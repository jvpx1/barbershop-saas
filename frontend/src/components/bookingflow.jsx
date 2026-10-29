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
    <section>
      <h2 className="text-lg font-semibold">
        <span className="mr-2 text-gray-400">{number}.</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function BookingFlow({ barbershop }) {
  const color = barbershop.primaryColor;
  const today = todayInZone(barbershop.timezone);
  const selectedStyle = { backgroundColor: color, borderColor: color, color: "#fff" };

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

  // Chave que identifica "qual busca de horários estamos esperando"
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

  // "Carregando" é derivado: a resposta guardada ainda não é da busca atual
  const loadingSlots = slotsKey !== null && slotsResult.key !== slotsKey;
  const slots = slotsResult.key === slotsKey ? slotsResult.slots : [];
  const slotsError = slotsResult.key === slotsKey ? slotsResult.error : "";

  const groups = ["Manhã", "Tarde", "Noite"]
    .map((name) => ({ name, items: slots.filter((s) => period(s.time) === name) }))
    .filter((g) => g.items.length > 0);

  // Mudar qualquer escolha anterior invalida o horário já selecionado
  function chooseService(id) {
    setServiceId(id);
    setSlot(null);
  }
  function chooseBarber(id) {
    setBarberId(id);
    setSlot(null);
  }
  function chooseDate(value) {
    setDate(value);
    setSlot(null);
  }

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
        // Alguém reservou antes: limpa a escolha e recarrega os horários
        setSlot(null);
        setRefresh((r) => r + 1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <section className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6">
        <h2 className="text-lg font-semibold text-green-800">Agendamento confirmado!</h2>
        <p className="mt-2 text-green-900">
          {confirmed.service.name} com {confirmed.barber.name}
        </p>
        <p className="text-green-900">
          {formatLongDate(confirmed.date)} às {confirmed.time}
        </p>
        <p className="mt-1 text-sm text-green-800">
          {barbershop.name}
          {barbershop.address ? ` · ${barbershop.address}` : ""}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-100"
        >
          Fazer outro agendamento
        </button>
      </section>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <Step number={1} title="Escolha o serviço">
        <ul className="space-y-2">
          {barbershop.services.map((s) => (
            <li key= {s.id}>
              <button
                type="button"
                onClick={() => chooseService(s.id)}
                style={serviceId === s.id ? selectedStyle : undefined}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition hover:border-gray-400"
              >
                <span>
                  {s.name}
                  <span className="ml-2 text-sm opacity-70"> {s.durationMinutes} min </span>
                </span>
                <span className="font-medium">{formatPrice(s.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Step>

      {serviceId && (
        <Step number={2} title="Escolha o barbeiro">
          <div className="flex flex-wrap gap-2">
            {barbershop.barbers.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => chooseBarber(b.id)}
                style={barberId === b.id ? selectedStyle : undefined}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm transition hover:border-gray-400"
              >
                {b.name}
              </button>
            ))}
          </div>
        </Step>
      )}

      {serviceId && barberId && (
        <Step number={3} title="Escolha o dia">
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => chooseDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          {date && <p className="mt-2 text-sm text-gray-500">{formatLongDate(date)}</p>}
        </Step>
      )}

      {slotsKey && (
        <Step number={4} title="Escolha o horário">
          {loadingSlots && <p className="text-gray-500">Buscando horários...</p>}
          {slotsError && <p className="text-red-600">{slotsError}</p>}
          {!loadingSlots && !slotsError && groups.length === 0 && (
            <p className="text-gray-500">
              Nenhum horário disponível neste dia. Tente outra data ou outro barbeiro.
            </p>
          )}
          {groups.map((group) => (
            <div key={group.name} className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-500">{group.name}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((s) => (
                  <button
                    key={s.startsAt}
                    type="button"
                    onClick={() => setSlot(s)}
                    style={slot?.startsAt === s.startsAt ? selectedStyle : undefined}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm transition hover:border-gray-400"
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
        <Step number={5} title="Seus dados">
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-gray-600">
              {service.name} com {barber.name}, {formatLongDate(date)} às {slot.time}
            </p>
            <input
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <input
              required
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
              placeholder="(00) 00000-0000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: color }}
              className="w-full rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Confirmando..." : "Confirmar agendamento"}
            </button>
          </form>
        </Step>
      )}
    </div>
  );
}