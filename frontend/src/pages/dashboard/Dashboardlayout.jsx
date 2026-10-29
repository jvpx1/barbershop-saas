// src/pages/dashboard/DashboardLayout.jsx
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.js";
import { Menu, X } from "lucide-react";

const MENU_ITEMS = [
  { path: "/dashboard/agenda", label: "Agenda" },
  { path: "/dashboard/barbeiros", label: "Barbeiros" },
  { path: "/dashboard/servicos", label: "Serviços" },
  { path: "/dashboard/financas", label: "Finanças" },
  { path: "/dashboard/config", label: "Configurações" },
];

export default function DashboardLayout() {
  const { user, barbershop, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0F1115] text-slate-200">
      
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#15171C]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          
          {/* LOGO / NOME DA BARBEARIA */}
          <div className="flex items-center gap-3">
            {barbershop?.logoUrl ? (
              <img 
                src={barbershop.logoUrl} 
                alt={barbershop.name} 
                className="h-8 w-8 rounded-lg object-cover" 
              />
            ) : (
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: barbershop?.primaryColor || "#f59e0b" }}
              >
                {barbershop?.name?.charAt(0) || "B"}
              </div>
            )}
            <span className="hidden text-lg font-semibold text-white sm:block truncate max-w-[200px]">
              {barbershop?.name || "Painel"}
            </span>
          </div>

          {/* ... (Resto do código da Topbar, Menu, etc. permanece igual) ... */}
          <nav className="hidden md:flex items-center gap-1">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.path} to={item.path}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-white/[0.08] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Olá, <strong className="text-slate-200">{user?.name?.split(" ")[0]}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              Sair
            </button>
          </div>

          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* MENU MOBILE */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-30 bg-[#0F1115] md:hidden overflow-y-auto">
          <nav className="flex flex-col p-4 space-y-1">
            {MENU_ITEMS.map((item) => (
              <NavLink
                key={item.path} to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    isActive ? "bg-white/[0.08] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="my-4 border-t border-white/[0.08]" />
            <div className="px-4 py-2 text-sm text-slate-400">
              Logado como <strong className="text-slate-200">{user?.name}</strong>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 rounded-xl border border-white/[0.08] px-4 py-3 text-left text-base font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Sair da conta
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1">
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
}