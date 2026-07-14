// Helpers de formato específicos del módulo BI. Complementan los básicos de
// src/lib/format.ts (money/num/pct) con nociones de delta: signo explícito
// (+/−), tono según magnitud, comparativas absoluta + porcentual.

import { money, pct } from "@/lib/format";
import type { BadgeTone } from "@/components/ui/badge";
import { DELTA_THRESHOLDS } from "./constants";

/** "+12.3%" / "−4.1%" / "0.0%" / "—" cuando el valor es null. */
export function formatDeltaPct(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  const abs = Math.abs(v).toFixed(digits);
  return `${sign}${abs}%`;
}

/** "+S/ 1,234.50" / "−S/ 800.00" / "S/ 0.00" / "—" cuando el valor es null. */
export function formatDeltaMoney(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${money(Math.abs(v))}`;
}

/** "+3.2 pp" / "−1.1 pp" para variaciones de porcentaje (delta_pp). */
export function formatDeltaPp(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(digits)} pp`;
}

/**
 * Tono semafórico para un delta% donde positivo es bueno (ventas, tickets, margen).
 * `strongOnly=true` reserva rojo/verde para variaciones grandes; suaves quedan neutrales.
 */
export function deltaTone(
  v: number | null | undefined,
  opts: { strongOnly?: boolean } = {},
): BadgeTone {
  if (v == null || !Number.isFinite(v)) return "neutral";
  const { strong_up, weak_up, weak_down, strong_down } = DELTA_THRESHOLDS;
  if (opts.strongOnly) {
    if (v >= strong_up) return "success";
    if (v <= strong_down) return "danger";
    return "neutral";
  }
  if (v >= strong_up) return "success";
  if (v >= weak_up) return "success";
  if (v <= strong_down) return "danger";
  if (v <= weak_down) return "warning";
  return "neutral";
}

/**
 * Igual pero invertido: negativo es bueno (días sin vender, capital atrapado).
 */
export function inverseDeltaTone(
  v: number | null | undefined,
  opts: { strongOnly?: boolean } = {},
): BadgeTone {
  if (v == null || !Number.isFinite(v)) return "neutral";
  return deltaTone(-v, opts);
}

/** Ícono de flecha ↑ ↓ → según signo — útil junto al delta pct. */
export function deltaArrow(v: number | null | undefined): "↑" | "↓" | "→" | "" {
  if (v == null || !Number.isFinite(v)) return "";
  const { weak_up, weak_down } = DELTA_THRESHOLDS;
  if (v >= weak_up) return "↑";
  if (v <= weak_down) return "↓";
  return "→";
}

/** Etiqueta legible de un rango de fechas `{ from, to }`. */
export function formatRango(from: string, to: string): string {
  if (from === to) return from;
  return `${from} → ${to}`;
}

/** "S/ 105,363 / S/ 116,667" — venta acumulada vs meta prorrateada. */
export function formatMoneyPair(a: number, b: number): string {
  return `${money(a)} / ${money(b)}`;
}

/** "84.3%" pero con tono adosado para colorear. */
export function formatAvance(v: number | null | undefined): { text: string; tone: BadgeTone } {
  const text = pct(v);
  if (v == null) return { text, tone: "neutral" };
  if (v >= 100) return { text, tone: "success" };
  if (v >= 95) return { text, tone: "success" };
  if (v >= 80) return { text, tone: "warning" };
  return { text, tone: "danger" };
}

/**
 * Etiqueta del mes "YYYY-MM" a formato legible en español ("Julio 2026").
 * El backend devuelve `"2026-07"`; queremos mostrar "Julio 2026".
 */
export function formatMes(ym: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return ym;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const d = new Date(year, month, 1);
  const label = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
