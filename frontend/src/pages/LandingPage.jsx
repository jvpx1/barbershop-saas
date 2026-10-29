// src/pages/LandingPage.jsx
import { Link } from "react-router-dom";
import { Scissors, Calendar, TrendingUp, ShieldCheck, Clock, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-200 font-sans selection:bg-amber-500/30">
      
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#0F1115]/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Scissors size={20} className="stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Barber<span className="text-amber-500">Pro</span>
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden px-4 py-2 text-sm font-medium text-slate-300 hover:text-white sm:block">
              Entrar
            </Link>
            <Link 
              to="/register" 
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-24 pb-32">
        {/* Efeito de brilho no fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            O sistema definitivo para sua barbearia
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-tight">
            Pare de perder tempo <br className="hidden sm:block" /> 
            com <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">agendamentos.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed">
            O BarberPro é o painel completo que sua barbearia precisa. Agenda online 24h, gestão de equipe, controle de serviços e relatórios de faturamento. Tudo em um só lugar.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto rounded-xl bg-amber-500 px-8 py-4 text-base font-bold text-black transition hover:bg-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transform duration-200"
            >
              Começar agora — é grátis
            </Link>
            <a 
              href="/barbearia-do-ze" 
              target="_blank"
              className="w-full sm:w-auto rounded-xl border border-white/[0.1] bg-white/[0.02] px-8 py-4 text-base font-bold text-white transition hover:bg-white/[0.05]"
            >
              Ver página de exemplo
            </a>
          </div>
        </div>
      </section>

      {/* RECURSOS (FEATURES) */}
      <section id="recursos" className="border-t border-white/[0.05] bg-[#13151A] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Tudo que você precisa para gerenciar</h2>
            <p className="mt-4 text-slate-400">Ferramentas poderosas, interface simples.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0F1115] p-8 transition hover:border-amber-500/30 group">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <Calendar size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Agenda Inteligente</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Seus clientes agendam sozinhos 24h por dia. Visualize o dia em lista ou em grade de horários.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0F1115] p-8 transition hover:border-amber-500/30 group">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Controle Financeiro</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Saiba exatamente quanto faturou, qual o seu ticket médio e o que ainda tem a receber no mês.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0F1115] p-8 transition hover:border-amber-500/30 group">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <Smartphone size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Sua Marca no Topo</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Página de agendamento personalizada com a logo, endereço e as cores da sua barbearia.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0F1115] p-8 transition hover:border-amber-500/30 group">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Sem Conflitos</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                O sistema bloqueia horários já ocupados automaticamente. Dois clientes nunca agendam o mesmo horário.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0F1115] p-8 transition hover:border-amber-500/30 group">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Gestão de Equipe</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cadastre seus barbeiros, defina os dias e horários de trabalho de cada um e controle quem está ativo.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-white/[0.05] bg-[#0F1115] p-8 transition hover:border-amber-500/30 group">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                <Scissors size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Catálogo de Serviços</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cadastre preços e tempos de duração. O sistema calcula a disponibilidade com base no tempo de cada corte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-3xl px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Pronto para modernizar sua barbearia?</h2>
          <p className="mt-4 text-slate-400 text-lg">Junte-se aos donos de barbearia que já pararam de perder tempo com papel e caneta.</p>
          <Link 
            to="/register" 
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-base font-bold text-black transition hover:bg-slate-200"
          >
            Criar minha conta grátis
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.05] bg-[#0B0D10] py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} BarberPro Studio. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}