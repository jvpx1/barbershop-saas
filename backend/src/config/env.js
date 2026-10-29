import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

function optional(name, fallback) {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: Number(optional("PORT", "3333")),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  CORS_ORIGIN: optional("CORS_ORIGIN", "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

if (Number.isNaN(env.PORT)) {
  throw new Error("PORT precisa ser um número");
}

if (env.NODE_ENV === "production" && env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres em produção");
}