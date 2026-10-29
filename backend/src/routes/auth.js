import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/auth.js";
import { env } from "../config/env.js";


const router = Router();

function signToken(user) {
  return jwt.sign(
    { barbershopId: user.barbershopId, role: user.role },
    env.JWT_SECRET,
    { subject: String(user.id), expiresIn: "7d" }
  );
}

// "Barbearia do Zé" -> "barbearia-do-ze"
function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Cadastro de uma nova barbearia + usuário dono
router.post("/register", async (req, res) => {
  const barbershopName = String(req.body.barbershopName ?? "").trim();
  const ownerName = String(req.body.ownerName ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  if (barbershopName.length < 2 || barbershopName.length > 100) {
    return res.status(400).json({ error: "Nome da barbearia inválido" });
  }
  if (ownerName.length < 2 || ownerName.length > 100) {
    return res.status(400).json({ error: "Nome do dono inválido" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" });
  }

  const emailInUse = await prisma.user.findUnique({ where: { email } });
  if (emailInUse) {
    return res.status(409).json({ error: "Este e-mail já está cadastrado" });
  }

  // Gera um slug único: se "navalha-club" existir, tenta "navalha-club-2", etc.
  const baseSlug = slugify(barbershopName) || "barbearia";
  let slug = baseSlug;
  let n = 2;
  while (await prisma.barbershop.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const barbershop = await prisma.barbershop.create({
    data: {
      name: barbershopName,
      slug,
      users: {
        create: { name: ownerName, email, passwordHash, role: "OWNER" },
      },
    },
    include: { users: true },
  });

  const user = barbershop.users[0];

  res.status(201).json({
    token: signToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    barbershop: { id: barbershop.id, name: barbershop.name, slug: barbershop.slug },
  });
});

// Login
router.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  const user = await prisma.user.findUnique({
    where: { email },
    include: { barbershop: true },
  });

  // Mesma mensagem para e-mail inexistente e senha errada
  const passwordOk = user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordOk) {
    return res.status(401).json({ error: "E-mail ou senha incorretos" });
  }

  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    barbershop: {
      id: user.barbershop.id,
      name: user.barbershop.name,
      slug: user.barbershop.slug,
    },
  });
});

// Rota protegida: devolve quem está logado
router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      barbershop: { select: { id: true, name: true, slug: true, timezone: true} },
    },
  });
  res.json(user);
});

router.get("/health", async (req, res) => {
  res.json({ status: "ok" });
});



export default router;