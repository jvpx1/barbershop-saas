// src/lib/api.js
import { clearSession, getToken } from "./auth.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = "GET", body, token } = {}) {
  // Prioridade: token explícito > token salvo (auto)
  const authToken = token ?? getToken();

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Token expirado/inválido: derruba a sessão e manda pro login
    if (res.status === 401 && getToken()) {
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw new ApiError(data?.error ?? "Erro inesperado", res.status);
  }

  return data;
}