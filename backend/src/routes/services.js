import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Todas as rotas deste arquivo exigem login
router.use(requireAuth);

// Valida o corpo e devolve só os campos permitidos
function validateService(body, { partial }) {
  const data = {};

  if (!partial || body.name !== undefined) {
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 100) return { error: "Nome inválido" };
    data.name = name;
  }

  if (!partial || body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 10000) {
      return { error: "Preço inválido" };
    }
    data.price = Math.round(price * 100) / 100;
  }

  if (!partial || body.durationMinutes !== undefined) {
    const duration = Number(body.durationMinutes);
    if (!Number.isInteger(duration) || duration < 5 || duration > 480) {
      return { error: "Duração inválida (5 a 480 minutos)" };
    }
    data.durationMinutes = duration;
  }

  if (partial && body.active !== undefined) {
    if (typeof body.active !== "boolean") {
      return { error: "O campo active deve ser true ou false" };
    }
    data.active = body.active;
  }

  return { data };
}

// Busca um serviço SOMENTE se ele pertencer à barbearia de quem está logado
async function findOwnService(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return null;

  return prisma.service.findFirst({
    where: { id, barbershopId: req.user.barbershopId },
  });
}

// Lista os serviços da barbearia (inclui os desativados)
router.get("/", async (req, res) => {
  const services = await prisma.service.findMany({
    where: { barbershopId: req.user.barbershopId },
    orderBy: { name: "asc" },
  });

  res.json(services);
});

// Cria um serviço
router.post("/", requireRole("OWNER"), async (req, res) => {
  const { data, error } = validateService(req.body ?? {}, { partial: false });
  if (error) return res.status(400).json({ error });

  const service = await prisma.service.create({
    data: { ...data, barbershopId: req.user.barbershopId },
  });

  res.status(201).json(service);
});

// Atualiza um serviço (só os campos enviados)
router.put("/:id", requireRole("OWNER"), async (req, res) => {
  const { data, error } = validateService(req.body ?? {}, { partial: true });
  if (error) return res.status(400).json({ error });
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar" });
  }

  const service = await findOwnService(req);
  if (!service) return res.status(404).json({ error: "Serviço não encontrado" });

  const updated = await prisma.service.update({
    where: { id: service.id },
    data,
  });

  res.json(updated);
});

// "Exclui" um serviço: na verdade desativa
router.delete("/:id", requireRole("OWNER"), async (req, res) => {
  const service = await findOwnService(req);
  if (!service) return res.status(404).json({ error: "Serviço não encontrado" });

  await prisma.service.update({
    where: { id: service.id },
    data: { active: false },
  });

  res.status(204).send();
});

export default router;