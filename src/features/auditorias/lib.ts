/* ────────────────────────────────────────────────────────────
 * Tipos + constantes + helpers puros de /auditorias.
 * Sin lógica de React ni de fetching.
 * ──────────────────────────────────────────────────────────── */

import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Database,
  Cloud,
  GitMerge,
} from "lucide-react";
import type { Column } from "@/components/ui/data-table";
import type { AuditResponse, IssueMeta, IssueSource } from "@/lib/types";

/* ───────────────────────── Labels & defaults ──────────────────────── */

export const ISSUE_LABELS: Record<string, string> = {
  naming_mismatches: "Nombres incorrectos",
  orphan_product_types_with_products: "Tipos huérfanos con productos",
  inactive_but_mapped: "Inactivos pero mapeados",
  subcategories_without_product_type: "Subcategorías sin product_type",
  categories_without_subcategories: "Categorías sin subcategorías",
  departments_without_categories: "Departamentos sin categorías",
  duplicate_product_type_names: "Nombres duplicados",
  products_without_classification: "Productos sin clasificar",
};

/** Tono del banner por severidad global. */
export const SEVERITY: Record<
  AuditResponse["severity"],
  { icon: typeof ShieldCheck; label: string; cls: string; iconCls: string }
> = {
  ok: {
    icon: ShieldCheck,
    label: "Catálogo saludable",
    cls: "border-success/30 bg-success-dim/40",
    iconCls: "text-success",
  },
  warning: {
    icon: ShieldAlert,
    label: "Hay inconsistencias por revisar",
    cls: "border-warning/30 bg-warning-dim/40",
    iconCls: "text-warning",
  },
  critical: {
    icon: ShieldX,
    label: "Inconsistencias críticas",
    cls: "border-danger/30 bg-danger-dim/40",
    iconCls: "text-danger",
  },
};

/** Estilo + ícono por LADO del sistema donde nace el problema. */
export const SOURCE_STYLE: Record<
  IssueSource,
  { icon: typeof Cloud; label: string; short: string; chip: string; dot: string }
> = {
  bsale: {
    icon: Cloud,
    label: "Problema en BSale (ERP)",
    short: "BSale",
    chip: "border-info/40 bg-info/15 text-info",
    dot: "bg-info",
  },
  local_db: {
    icon: Database,
    label: "Problema en tu BD local (taxonomía)",
    short: "BD local",
    chip: "border-violet/40 bg-violet/15 text-violet",
    dot: "bg-violet",
  },
  both: {
    icon: GitMerge,
    label: "Problema en ambos lados",
    short: "Mixto",
    chip: "border-warning/40 bg-warning/15 text-warning",
    dot: "bg-warning",
  },
};

/* ── Fallback meta (cuando el backend no devuelve `meta` por compatibilidad). ─ */
export const FALLBACK_META: IssueMeta = {
  source: "both",
  where: "BSale + BD local",
  what: "Inconsistencia detectada.",
  impact: "",
  fix_hint: "",
  fix_link: null,
  row_label: "Item",
};

/* ── Columnas curadas por tipo de issue (en vez de Object.keys() crudo). ─── */
export type RowCols = Column<Record<string, unknown>>[];

export function prettyHeader(k: string): string {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function fmtCell(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}
