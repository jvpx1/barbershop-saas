// src/pages/DashboardPage.jsx
import { useAuth } from "../contexts/AuthContext.js";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto mt-16 max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel</h1>
        <button
          onClick={logout}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Sair
        </button>
      </div>
      <p className="mt-4 text-gray-600">
        Bem-vindo, <strong>{user?.name}</strong>! ({user?.email})
      </p>
      <p className="mt-2 text-sm text-gray-500">
        Aqui vai ficar a agenda, barbeiros, serviços e configurações (Fase 2).
      </p>
    </main>
  );
}