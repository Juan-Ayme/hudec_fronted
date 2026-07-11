/* ────────────────────────────────────────────────────────────
 * Tipos + constantes de /product-types. Sin lógica de React.
 * ──────────────────────────────────────────────────────────── */

export type Toggle = "all" | "unmapped" | "inactive";

export const TOGGLES: { key: Toggle; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "unmapped", label: "Sin mapear" },
  { key: "inactive", label: "Inactivos" },
];
