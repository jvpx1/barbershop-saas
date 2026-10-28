import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateBarber(body, { partial }) {
  const data = {};

  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 100) return { error: "Nome inválido" };
    data.name = name;
  }

  if (body.photoUrl !== undefined) {
    if (body.photoUrl === null || body.photoUrl === "") {
      data.photoUrl = null;
    } else {
      const url = String(body.photoUrl).trim();
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol) || url.length > 500) {
          throw new Error("invalid");
        }
      } catch {
        return { error: "URL da foto inválida" };
      }
      data.photoUrl = url;
    }
  }

  if (partial && body.active !== undefined) {
    if (typeof body.active !== "boolean") {
      return { error: "O campo active deve ser true ou false" };
    }
    data.active = body.active;
  }

  return { data };
}

function validateWorkingHours(hours) {
  if (!Array.isArray(hours) || hours.length > 50) {
    return { error: "Informe a lista hours (máximo de 50 intervalos)" };
  }

  const clean = [];

  for (const item of hours) {
    const weekday = Number(item?.weekday);
    const startTime = item?.startTime;
    const endTime = item?.endTime;

    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return { error: "weekday deve ir de 0 (domingo) a 6 (sábado)" };
    }
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      return { error: "Use o formato HH:MM, por exemplo 09:00" };
    }
    if (startTime >= endTime) {
      return { error: `Intervalo inválido: ${startTime} precisa ser antes de ${endTime}` };
    }

    clean.push({ weekday, startTime, endTime });
  }

  // Ordena por dia e horário, e confere se há sobreposição no mesmo dia
  clean.sort(
    (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)
  );

  for (let i = 1; i < clean.length; i++) {
    const prev = clean[i - 1];
    const cur = clean[i];
    if (prev.weekday === cur.weekday && cur.startTime < prev.endTime) {
      return { error: "Há intervalos sobrepostos no mesmo dia" };
    }
  }

  return { hours: clean };
}

// Busca um barbeiro SOMENTE se ele pertencer à barbearia de quem está logado
async function findOwnBarber(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return null;

  return prisma.barber.findFirst({
    where: { id, barbershopId: req.user.barbershopId },
  });
}

// Lista os barbeiros da barbearia, com os horários de trabalho
router.get("/", async (req, res) => {
  const barbers = await prisma.barber.findMany({
    where: { barbershopId: req.user.barbershopId },
    orderBy: { name: "asc" },
    include: {
      workingHours: {
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
        select: { id: true, weekday: true, startTime: true, endTime: true },
      },
    },
  });

  res.json(barbers);
});

// Cria um barbeiro
router.post("/", requireRole("OWNER"), async (req, res) => {
  const { data, error } = validateBarber(req.body ?? {}, { partial: false });
  if (error) return res.status(400).json({ error });

  const barber = await prisma.barber.create({
    data: { ...data, barbershopId: req.user.barbershopId },
  });

  res.status(201).json(barber);
});

// Atualiza um barbeiro (só os campos enviados)
router.put("/:id", requireRole("OWNER"), async (req, res) => {
  const { data, error } = validateBarber(req.body ?? {}, { partial: true });
  if (error) return res.status(400).json({ error });
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar" });
  }

  const barber = await findOwnBarber(req);
  if (!barber) return res.status(404).json({ error: "Barbeiro não encontrado" });

  const updated = await prisma.barber.update({
    where: { id: barber.id },
    data,
  });

  res.json(updated);
});

// Desativa um barbeiro
router.delete("/:id", requireRole("OWNER"), async (req, res) => {
  const barber = await findOwnBarber(req);
  if (!barber) return res.status(404).json({ error: "Barbeiro não encontrado" });

  await prisma.barber.update({
    where: { id: barber.id },
    data: { active: false },
  });

  res.status(204).send();
});

// Substitui TODOS os horários de trabalho do barbeiro
router.put("/:id/working-hours", requireRole("OWNER"), async (req, res) => {
  const { hours, error } = validateWorkingHours(req.body?.hours);
  if (error) return res.status(400).json({ error });

  const barber = await findOwnBarber(req);
  if (!barber) return res.status(404).json({ error: "Barbeiro não encontrado" });

  // Apaga os antigos e cria os novos na mesma transação
  await prisma.$transaction([
    prisma.workingHour.deleteMany({ where: { barberId: barber.id } }),
    prisma.workingHour.createMany({
      data: hours.map((h) => ({ ...h, barberId: barber.id })),
    }),
  ]);

  const saved = await prisma.workingHour.findMany({
    where: { barberId: barber.id },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    select: { id: true, weekday: true, startTime: true, endTime: true },
  });

  res.json(saved);
});

export default router;