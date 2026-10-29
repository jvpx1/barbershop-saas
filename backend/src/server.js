import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.js";
import servicesRoutes from "./routes/services.js";
import barbersRoutes from "./routes/barbers.js";
import appointmentsRoutes from "./routes/appointments.js";
import publicRoutes from "./routes/public.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/barbers", barbersRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/public", publicRoutes);


app.get("/api/health", async (req, res) => {
  const barbershops = await prisma.barbershop.count();

  res.json({ status: "ok", barbershops });
});

const PORT = process.env.PORT || 3333;

app.listen(PORT,'0.0.0.0', () => {

  console.log(`API rodando em http://localhost:${PORT}`);

});

