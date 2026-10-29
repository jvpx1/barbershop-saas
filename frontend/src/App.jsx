// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import BarbershopPage from "./pages/BarberShopPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Importações do Painel
import FinancasPage from "./pages/dashboard/FinancasPage.jsx";
import AgendaPage from "./pages/dashboard/AgendaPage.jsx";
import BarbeirosPage from "./pages/dashboard/BarbeirosPage.jsx";
import ServicosPage from "./pages/dashboard/ServicosPage.jsx";
import ConfigPage from "./pages/dashboard/ConfigPage.jsx";
import DashboardLayout from "./pages/dashboard/Dashboardlayout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import PublicOnlyRoute from "./components/PublicOnlyRoute.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* AUTH: Só acessa se NÃO estiver logado */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Painel (protegido) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Redireciona /dashboard para /dashboard/agenda automaticamente */}
          <Route index element={<Navigate to="/dashboard/agenda" replace />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="barbeiros" element={<BarbeirosPage />} />
          <Route path="servicos" element={<ServicosPage />} />
          <Route path="financas" element={<FinancasPage />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>
      </Route>

      {/* Página pública da barbearia */}
      <Route path="/:slug" element={<BarbershopPage />} />

      {/* 404 */}
      <Route path="*" element={<p className="p-8 text-center">Página não encontrada</p>} />
    </Routes>
  );
}