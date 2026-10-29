// src/middlewares/errorHandler.js
import { Prisma } from "../../generated/prisma/client.ts";

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Rota não encontrada" });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Erros conhecidos do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Registro já existe" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Registro não encontrado" });
    }
    if (err.code === "P2034") {
      return res.status(409).json({ error: "Conflito, tente novamente" });
    }
  }

  // JSON malformado no body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido no corpo da requisição" });
  }

  // Loga em dev, esconde detalhes em prod
  console.error("[error]", err);
  const message =
    process.env.NODE_ENV === "production"
      ? "Erro interno"
      : err.message || "Erro interno";

  res.status(err.status || 500).json({ error: message });
}