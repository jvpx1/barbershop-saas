// src/contexts/AuthProvider.jsx
import { useState } from "react";
import { api } from "../lib/api.js";
import { AuthContext } from "./AuthContext.js";
import { clearSession, getUser, saveSession, getToken } from "../lib/auth.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? getUser() : null));

  async function login({ email, password }) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    saveSession({ token: data.token, user: data.user });
    setUser(data.user);
    return data;
  }

  async function register({ barbershopName, ownerName, email, password }) {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: { barbershopName, ownerName, email, password },
    });
    saveSession({ token: data.token, user: data.user });
    setUser(data.user);
    return data;
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  const value = { user, login, register, logout, isAuthenticated: Boolean(user) };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}