
import React from "react";

export const cn = (...classes) => classes.filter(Boolean).join(" ");

export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-500">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, caption, symbol, accent = "amber" }) {
  const accents = {
    amber: "text-amber-400 bg-amber-400/10 ring-amber-400/20",
    green: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20",
    red: "text-red-400 bg-red-400/10 ring-red-400/20",
    blue: "text-sky-400 bg-sky-400/10 ring-sky-400/20",
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#15171C] p-4 transition-colors hover:border-white/[0.12] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{caption}</p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ring-1",
            accents[accent] || accents.amber
          )}
          aria-hidden="true"
        >
          {symbol}
        </span>
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  CONFIRMED:
    "border-sky-400/20 bg-sky-400/[0.08] text-sky-300",
  CANCELLED:
    "border-red-400/20 bg-red-400/[0.08] text-red-300",
  DONE:
    "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
};

const STATUS_LABELS = {
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  DONE: "Concluído",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium",
        STATUS_STYLES[status] || "border-white/10 bg-white/5 text-slate-300"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "CONFIRMED" && "bg-sky-400",
          status === "CANCELLED" && "bg-red-400",
          status === "DONE" && "bg-emerald-400",
          !STATUS_STYLES[status] && "bg-slate-400"
        )}
      />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/[0.09] bg-[#15171C] px-3 py-2.5 text-sm text-slate-200 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function IconButton({ children, onClick, label, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-slate-300 transition hover:border-amber-400/30 hover:bg-amber-400/[0.07] hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.07] bg-[#15171C]",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-white">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
