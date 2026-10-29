
import { env } from "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.js";
import servicesRoutes from "./routes/services.js";
import barbersRoutes from "./routes/barbers.js";
import appointmentsRoutes from "./routes/appointments.js";
import publicRoutes from "./routes/public.js";
import barbershopRoutes from "./routes/barbershop.js"
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

const app = express();

// Atrás de proxy (Railway, Render, Fly, Nginx...)
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Segurança
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.length > 0 ? env.CORS_ORIGIN : false,
    credentials: true,
  })
);

// Body
app.use(express.json({ limit: "100kb" }));

// Rate limit específico pra auth (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // 20 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em alguns minutos." },
});

// Health / Ready
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/ready", async (req, res) => {
  try {
    const barbershops = await prisma.barbershop.count();
    res.json({ status: "ok", barbershops });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

// Rotas
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/barbershop", barbershopRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/barbers", barbersRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/public", publicRoutes);

// 404 + erros (SEMPRE por último)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`API rodando em http://localhost:${env.PORT}`);
});