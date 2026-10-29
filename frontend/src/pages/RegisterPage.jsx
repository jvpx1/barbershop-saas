// src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    barbershopName: "",
    ownerName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-16 max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold">Cadastrar barbearia</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          minLength={2}
          placeholder="Nome da barbearia"
          value={form.barbershopName}
          onChange={(e) => setForm({ ...form, barbershopName: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <input
          required
          minLength={2}
          placeholder="Seu nome"
          value={form.ownerName}
          onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <input
          type="email"
          required
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Senha (mínimo 8 caracteres)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Já tem conta?{" "}
        <Link to="/login" className="font-medium text-gray-900 underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}