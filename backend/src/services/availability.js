import { DateTime } from "luxon";
import { prisma } from "../lib/prisma.js";

const SLOT_STEP_MINUTES = 30;

export async function getAvailableSlots({ barbershop, barberId, serviceId, date, db = prisma }) {
  const [barber, service] = await Promise.all([
    db.barber.findFirst({
      where: { id: barberId, barbershopId: barbershop.id, active: true },
    }),
    db.service.findFirst({
      where: { id: serviceId, barbershopId: barbershop.id, active: true },
    }),
  ]);

  if (!barber || !service) {
    return { error: "Barbeiro ou serviço inválido" };
  }

  const dayStart = DateTime.fromISO(date, { zone: barbershop.timezone }).startOf("day");
  if (!dayStart.isValid) {
    return { error: "Data inválida (use AAAA-MM-DD)" };
  }
  const dayEnd = dayStart.plus({ days: 1 });

  // Luxon: 1 = segunda ... 7 = domingo. No nosso banco: 0 = domingo ... 6 = sábado
  const weekday = dayStart.weekday % 7;

  const [workingHours, appointments] = await Promise.all([
    db.workingHour.findMany({
      where: { barberId, weekday },
      orderBy: { startTime: "asc" },
    }),
    db.appointment.findMany({
      where: {
        barberId,
        status: "CONFIRMED",
        startsAt: { lt: dayEnd.toJSDate() },
        endsAt: { gt: dayStart.toJSDate() },
      },
    }),
  ]);

  const now = DateTime.now();
  const slots = [];

  for (const { startTime, endTime } of workingHours) {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const rangeStart = dayStart.set({ hour: startH, minute: startM });
    const rangeEnd = dayStart.set({ hour: endH, minute: endM });

    for (
      let slotStart = rangeStart;
      ;
      slotStart = slotStart.plus({ minutes: SLOT_STEP_MINUTES })
    ) {
      const slotEnd = slotStart.plus({ minutes: service.durationMinutes });

      if (slotEnd > rangeEnd) break; // o serviço não cabe mais no expediente
      if (slotStart <= now) continue; // horário que já passou

      // Conflito: o horário começa antes do fim do agendamento
      // E termina depois do início dele
      const busy = appointments.some(
        (a) =>
          slotStart.toMillis() < a.endsAt.getTime() &&
          slotEnd.toMillis() > a.startsAt.getTime()
      );

      if (!busy) {
        slots.push({
          time: slotStart.toFormat("HH:mm"),
          startsAt: slotStart.toUTC().toISO(),
        });
      }
    }
  }

  return { slots, service};
}