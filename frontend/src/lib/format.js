//deixando o preço no formato brasileiro
export function formatPrice(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Telefone com máscara: (00) 00000-0000
export function formatPhone(value) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// "Hoje" no fuso da barbearia, no formato AAAA-MM-DD
export function todayInZone(timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

// "2026-10-26" -> "segunda-feira, 26 de outubro"
export function formatLongDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}