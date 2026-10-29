// src/components/PublicOnlyRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";

export default function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();

  // Se o usuário JÁ estiver logado, manda ele pro painel
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se não estiver logado, deixa ele ver a tela (login/registro)
  return <Outlet />;
}