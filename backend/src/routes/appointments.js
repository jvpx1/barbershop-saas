import { Router } from "express";
import { DateTime } from "luxon";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { createAppointment } from "../services/appointments.js";

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
// router.get("/", async (req, res) => {
//   const barbershop = await prisma.barbershop.findUnique({
//     where: { id: req.user.barbershopId },
//     select: { timezone: true },
//   });
//   const zone = barbershop.timezone;

//   // Sem date, usa "hoje" no fuso da barbearia
//   const start = req.query.date
//     ? DateTime.fromISO(String(req.query.date), { zone }).startOf("day")
//     : DateTime.now().setZone(zone).startOf("day");

//   if (!start.isValid) {
//     return res.status(400).json({ error: "Data inválida (use AAAA-MM-DD)" });
//   }

//   const days = req.query.days === undefined ? 1 : Number(req.query.days);
//   if (!Number.isInteger(days) || days < 1 || days > 31) {
//     return res.status(400).json({ error: "days deve ir de 1 a 31" });
//   }

//   const where = {
//     barbershopId: req.user.barbershopId,
//     startsAt: { gte: start.toJSDate(), lt: start.plus({ days }).toJSDate() },
//   };

//   if (req.query.barberId !== undefined) {
//     const barberId = Number(req.query.barberId);
//     if (!Number.isInteger(barberId)) {
//       return res.status(400).json({ error: "barberId inválido" });
//     }
//     where.barberId = barberId;
//   }

//   if (req.query.status !== undefined) {
//     if (!VALID_STATUS.includes(req.query.status)) {
//       return res.status(400).json({ error: "status inválido" });
//     }
//     where.status = req.query.status;
//   }

//   const appointments = await prisma.appointment.findMany({
//     where,
//     orderBy: { startsAt: "asc" },
//     select: appointmentSelect,
//   });

//   res.json(appointments);
// });



router.get("/", async (req, res) => {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: req.user.barbershopId },
    select: { timezone: true },
  });
  const zone = barbershop.timezone;

  // Data inicial: com ?date, usa ela; senão "hoje" no fuso da barbearia
  const start = req.query.date
    ? DateTime.fromISO(String(req.query.date), { zone }).startOf("day")
    : DateTime.now().setZone(zone).startOf("day");

  if (!start.isValid) {
    return res.status(400).json({ error: "Data inválida (use AAAA-MM-DD)" });
  }

  // Janela: padrão 1 dia; se ?days=N, N dias (1..31)
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

  // ---- Paginação (opcional) ----
  const wantsPagination =
    req.query.page !== undefined || req.query.limit !== undefined;

  if (!wantsPagination) {
    // Comportamento antigo: array puro
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startsAt: "asc" },
      select: appointmentSelect,
    });
    return res.json(appointments);
  }

  // Com paginação: retorna { data, pagination }
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({ error: "page deve ser >= 1" });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: "limit deve ir de 1 a 100" });
  }

  const [total, data] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: { startsAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: appointmentSelect,
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
});

// detalhe de um agendamento
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: "Agendamento não encontrado" });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id, barbershopId: req.user.barbershopId },
    select: appointmentSelect,
  });

  if (!appointment) {
    return res.status(404).json({ error: "Agendamento não encontrado" });
  }

  res.json(appointment);
});


// OWNER/BARBER cria agendamento pelo painel
router.post("/", requireRole("OWNER"), async (req, res) => {
  const barberId = Number(req.body.barberId);
  const serviceId = Number(req.body.serviceId);
  const customerName = String(req.body.customerName ?? "").trim();
  const customerPhone = String(req.body.customerPhone ?? "").replace(/\D/g, "");
  const { startsAt } = req.body;

  if (!Number.isInteger(barberId) || !Number.isInteger(serviceId) || !startsAt) {
    return res.status(400).json({ error: "Informe barberId, serviceId e startsAt" });
  }
  if (customerName.length < 2 || customerName.length > 100) {
    return res.status(400).json({ error: "Nome inválido" });
  }
  if (customerPhone.length < 10 || customerPhone.length > 11) {
    return res.status(400).json({ error: "Telefone inválido" });
  }

  const barbershop = await prisma.barbershop.findUnique({
    where: { id: req.user.barbershopId },
    select: { id: true, timezone: true },
  });
  if (!barbershop) {
    return res.status(404).json({ error: "Barbearia não encontrada" });
  }

  const result = await createAppointment({
    barbershop,
    barberId,
    serviceId,
    customerName,
    customerPhone,
    startsAt,
  });

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  const { id, startsAt: start, endsAt, status } = result.appointment;
  res.status(201).json({ id, startsAt: start, endsAt, status, customerName });
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
    const agora = new Date();
    const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);

    if(appointment.startsAt >= amanha) {
      return res.status(409).json({ error: "Só é possível concluir agendamentos que já tenham começado" });
    }
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
    select: appointmentSelect,
  });

  res.json(updated);
});

export default router;