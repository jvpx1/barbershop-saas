import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api.js";
// import { formatPrice } from "../lib/format.js";
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

    return () => {
      ignore = true;
    };
  }, [slug]);

  // Só vale o resultado que pertence ao slug atual
  const { barbershop, error } =
    result.slug === slug ? result : { barbershop: null, error: "" };

  if (error) {
    return <p className="p-8 text-center text-red-600">{error}</p>;
  }

  if (!barbershop) {
    return <p className="p-8 text-center text-gray-500">Carregando...</p>;
  }
  
      return (
    <main className="mx-auto max-w-2xl p-6">
      <header
        className="rounded-xl p-6 text-white"
        style={{ backgroundColor: barbershop.primaryColor }}
      >
        <h1 className="text-2xl font-bold"> {barbershop.name}</h1>
        {barbershop.address && <p className="opacity-90">{barbershop.address}</p>}
        {barbershop.phone && <p className="opacity-90">{barbershop.phone}</p>}
      </header>
        
      <BookingFlow barbershop={barbershop} />
    </main>
  );
}