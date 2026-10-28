import { DateTime } from "luxon";
import { prisma } from "../lib/prisma.js";
import { getAvailableSlots } from "./availability.js";

export async function createAppointment({
  barbershop,
  barberId,
  serviceId,
  customerName,
  customerPhone,
  startsAt,
}) {
  const start = DateTime.fromISO(startsAt, { zone: "utc" });
  if (!start.isValid) {
    return { status: 400, error: "startsAt inválido" };
  }

  // Data do agendamento no fuso da barbearia
  const date = start.setZone(barbershop.timezone).toISODate();

  try {
    return await prisma.$transaction(
      async (tx) => {
        // Reaproveita a mesma lógica de disponibilidade, agora dentro da transação
        const result = await getAvailableSlots({
          barbershop,
          barberId,
          serviceId,
          date,
          db: tx,
        });

        if (result.error) {
          return { status: 400, error: result.error };
        }

        const isAvailable = result.slots.some(
          (slot) => DateTime.fromISO(slot.startsAt).toMillis() === start.toMillis()
        );

        if (!isAvailable) {
          return { status: 409, error: "Horário indisponível" };
        }

        const appointment = await tx.appointment.create({
          data: {
            barbershopId: barbershop.id,
            barberId,
            serviceId,
            customerName,
            customerPhone,
            startsAt: start.toJSDate(),
            endsAt: start.plus({ minutes: result.service.durationMinutes }).toJSDate(),
          },
        });

        return { appointment };
      },
      { isolationLevel: "Serializable" }
    );
  } catch (err) {
    // P2034: o banco abortou a transação por conflito com outra reserva simultânea
    if (err.code === "P2034") {
      return {
        status: 409,
        error: "Esse horário acabou de ser reservado. Escolha outro.",
      };
    }
    throw err;
    
  }
}