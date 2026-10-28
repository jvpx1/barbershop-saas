import { Router } from "express";
import { DateTime } from "luxon";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

const VALID_STATUS = ["CONFIRMED", "CANCELLED", "DONE"];

const appointmentSelect = {
  id: true,
  startsAt: true,
  endsAt: true,
  status: true,
  customerName: true,
  customerPhone: true,
  barber: { select: { id: true, name: true } },
  service: { select: { id: true, name: true, price: true, durationMinutes: true } },
};

// Lista agendamentos: ?date=AAAA-MM-DD&days=1&barberId=ID&status=CONFIRMED
router.get("/", async (req, res) => {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: req.user.barbershopId },
    select: { timezone: true },
  });
  const zone = barbershop.timezone;

  // Sem date, usa "hoje" no fuso da barbearia
  const start = req.query.date
    ? DateTime.fromISO(String(req.query.date), { zone }).startOf("day")
    : DateTime.now().setZone(zone).startOf("day");

  if (!start.isValid) {
    return res.status(400).json({ error: "Data inválida (use AAAA-MM-DD)" });
  }

  const days = req.query.days === undefined ? 1 : Number(req.query.days);
  if (!Number.isInteger(days) || days < 1 || days > 31) {
    return res.status(400).json({ error: "days deve ir de 1 a 31" });
  }

  const where = {
    barbershopId: req.user.barbershopId,
    startsAt: { gte: start.toJSDate(), lt: start.plus({ days }).toJSDate() },
  };

  if (req.query.barberId !== undefined) {
    const barberId = Number(req.query.barberId);
    if (!Number.isInteger(barberId)) {
      return res.status(400).json({ error: "barberId inválido" });
    }
    where.barberId = barberId;
  }

  if (req.query.status !== undefined) {
    if (!VALID_STATUS.includes(req.query.status)) {
      return res.status(400).json({ error: "status inválido" });
    }
    where.status = req.query.status;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startsAt: "asc" },
    select: appointmentSelect,
  });

  res.json(appointments);
});

// Cancela ou conclui um agendamento
router.patch("/:id/status", requireRole("OWNER"), async (req, res) => {
  const status = req.body?.status;
  if (!["CANCELLED", "DONE"].includes(status)) {
    return res.status(400).json({ error: "status deve ser CANCELLED ou DONE" });
  }

  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: "Agendamento não encontrado" });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id, barbershopId: req.user.barbershopId },
  });
  if (!appointment) {
    return res.status(404).json({ error: "Agendamento não encontrado" });
  }

  if (appointment.status !== "CONFIRMED") {
    return res
      .status(409)
      .json({ error: "Só é possível alterar agendamentos confirmados" });
  }

  if (status === "DONE" && appointment.startsAt > new Date()) {
    return res.status(409).json({ error: "Esse atendimento ainda não começou" });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
    select: appointmentSelect,
  });

  res.json(updated);
});

export default router;