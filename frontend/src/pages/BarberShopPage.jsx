// src/pages/BarberShopPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import BookingFlow from "../components/bookingflow.jsx";

export default function BarbershopPage() {
  const { slug } = useParams();
  const [result, setResult] = useState({ slug: null, barbershop: null, error: "" });

  useEffect(() => {
    let ignore = false;
    api(`/api/public/${slug}`)
      .then((data) => {
        if (!ignore) setResult({ slug, barbershop: data, error: "" });
      })
      .catch((err) => {
        if (!ignore) setResult({ slug, barbershop: null, error: err.message });
      });
    return () => { ignore = true; };
  }, [slug]);

  const { barbershop, error } = result.slug === slug ? result : { barbershop: null, error: "" };

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-8">
        <p className="rounded-xl border border-red-900 bg-red-950/50 px-6 py-4 text-center text-red-400">{error}</p>
      </main>
    );
  }

  if (!barbershop) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">Carregando...</p>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-slate-950 pb-12">
      <div className="mx-auto max-w-2xl px-4 pt-8 sm:px-6">
        
        <header
          className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex items-center gap-4"
          style={{ backgroundColor: barbershop.primaryColor }}
        >
          <div className="absolute inset-0 bg-black/20" />
          
          {/* LOGO DA BARBEARIA */}
          {barbershop.logoUrl && (
            <img 
              src={barbershop.logoUrl} 
              alt={barbershop.name} 
              className="relative z-10 h-16 w-16 rounded-full object-cover border-2 border-white/20 shadow-md bg-white/10"
            />
          )}

          <div className="relative z-10 flex-1">
            <h1 className="text-3xl font-bold tracking-tight"> {barbershop.name}</h1>
            {barbershop.address && <p className="mt-1 opacity-90">{barbershop.address}</p>}
            {barbershop.phone && <p className="mt-0.5 opacity-90">{barbershop.phone}</p>}
          </div>
        </header>
          
        <BookingFlow barbershop={barbershop} />
      </div>
    </main>
  );
}