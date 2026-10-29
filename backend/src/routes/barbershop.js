import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Todas as rotas exigem login
router.use(requireAuth);

// ---------------------------------------------------------------------------
// GET /api/barbershop — dados da própria barbearia (pra popular tela de config)
// ---------------------------------------------------------------------------
router.get("/", async (req, res) => {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: req.user.barbershopId },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      phone: true,
      address: true,
      timezone: true,
      createdAt: true,
    },
  });

  if (!barbershop) {
    return res.status(404).json({ error: "Barbearia não encontrada" });
  }

  res.json(barbershop);
});

// ---------------------------------------------------------------------------
// PATCH /api/barbershop — OWNER edita dados da própria barbearia
// ---------------------------------------------------------------------------
const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Lista de fusos IANA que o Intl conhece (evita fuso inventado)
function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

router.patch("/", requireRole("OWNER"), async (req, res) => {
  const body = req.body ?? {};
  const data = {};

  // name
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: "Nome inválido (2 a 100 caracteres)" });
    }
    data.name = name;
  }

  // logoUrl (aceita null ou "" pra limpar)
  if (body.logoUrl !== undefined) {
    if (body.logoUrl === null || body.logoUrl === "") {
      data.logoUrl = null;
    } else {
      const url = String(body.logoUrl).trim();
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol) || url.length > 500) {
          throw new Error("invalid");
        }
      } catch {
        return res.status(400).json({ error: "URL do logo inválida" });
      }
      data.logoUrl = url;
    }
  }

  // primaryColor
  if (body.primaryColor !== undefined) {
    const color = String(body.primaryColor).trim();
    if (!HEX_COLOR.test(color)) {
      return res.status(400).json({ error: "Cor deve ser hexadecimal (#RRGGBB)" });
    }
    data.primaryColor = color;
  }

  // phone (aceita null ou "" pra limpar)
  if (body.phone !== undefined) {
    if (body.phone === null || body.phone === "") {
      data.phone = null;
    } else {
      const phone = String(body.phone).trim();
      if (phone.length < 8 || phone.length > 20) {
        return res.status(400).json({ error: "Telefone inválido" });
      }
      data.phone = phone;
    }
  }

  // address (aceita null ou "" pra limpar)
  if (body.address !== undefined) {
    if (body.address === null || body.address === "") {
      data.address = null;
    } else {
      const address = String(body.address).trim();
      if (address.length < 5 || address.length > 200) {
        return res.status(400).json({ error: "Endereço inválido (5 a 200 caracteres)" });
      }
      data.address = address;
    }
  }

  // timezone
  if (body.timezone !== undefined) {
    const timezone = String(body.timezone).trim();
    if (!isValidTimezone(timezone)) {
      return res.status(400).json({ error: "Fuso horário inválido" });
    }
    data.timezone = timezone;
  }

  // slug — NÃO editável por segurança (quebraria links públicos).
  // Se um dia quiser permitir, precisa checar unicidade e avisar o dono.

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar" });
  }

  try {
    const updated = await prisma.barbershop.update({
      where: { id: req.user.barbershopId },
      data,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        phone: true,
        address: true,
        timezone: true,
      },
    });
    res.json(updated);
  } catch (err) {
    // P2002: colisão de unique (não deve acontecer aqui, mas por via das dúvidas)
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Já existe uma barbearia com esse valor" });
    }
    throw err;
  }
});

export default router;