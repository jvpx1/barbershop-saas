import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getAvailableSlots } from "../services/availability.js";
import { createAppointment } from "../services/appointments.js";

const router = Router();

//não precisa de autenticação, é público

// Retorna informações da barbearia, serviços e barbeiros
router.get("/:slug", async (req, res) => {
  const barbershop = await prisma.barbershop.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      logoUrl: true,
      primaryColor: true,
      phone: true,
      address: true,
      services: {
        where: { active: true },
        select: { id: true, name: true, price: true, durationMinutes: true },
      },
      barbers: {
        where: { active: true },
        select: { id: true, name: true, photoUrl: true },
      },
    },
  });

  if (!barbershop) {
    return res.status(404).json({ error: "Barbearia não encontrada" });
  }
  res.json(barbershop);
});

router.get("/:slug/availability", async (req, res) => {
  const barberId = Number(req.query.barberId);
  const serviceId = Number(req.query.serviceId);
  const { date } = req.query;

  if (!Number.isInteger(barberId) || !Number.isInteger(serviceId) || !date) {
    return res.status(400).json({ error: "Informe barberId, serviceId e date" });
  }

  const barbershop = await prisma.barbershop.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, timezone: true },
  });

  if (!barbershop) {
    return res.status(404).json({ error: "Barbearia não encontrada" });
  }

  const result = await getAvailableSlots({ barbershop, barberId, serviceId, date });

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result.slots);
});

router.post("/:slug/appointments", async (req, res) => {
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
    where: { slug: req.params.slug },
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

export default router;