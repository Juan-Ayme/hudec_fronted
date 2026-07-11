"use client";

import Link from "next/link";
import {
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  Lightbulb,
  Info,
} from "lucide-react";
import { dateTime } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import type { IssueMeta } from "@/lib/types";
import { SOURCE_STYLE, type RowCols, prettyHeader, fmtCell } from "../lib";

/* ── Columnas curadas por tipo de issue (en vez de Object.keys() crudo). ─── */

function colsForIssue(key: string): RowCols | null {
  const txt = (k: string): Column<Record<string, unknown>> => ({
    key: k,
    header: prettyHeader(k),
    render: (r) => fmtCell(r[k]),
  });
  const numRight = (k: string): Column<Record<string, unknown>> => ({
    key: k,
    header: prettyHeader(k),
    align: "right",
    render: (r) => fmtCell(r[k]),
  });

  switch (key) {
    case "naming_mismatches":
      return [
        numRight("id"),
        { key: "current_name", header: "Nombre en BSale", render: (r) => (
          <code className="font-mono text-xs text-danger">{fmtCell(r.current_name)}</code>
        )},
        { key: "expected_name", header: "Esperado por tu BD", render: (r) => (
          <code className="font-mono text-xs text-success">{fmtCell(r.expected_name)}</code>
        )},
        txt("department"),
        txt("category"),
        txt("subcategory"),
        numRight("productos"),
      ];
    case "orphan_product_types_with_products":
      return [numRight("id"), txt("name"), numRight("productos")];
    case "inactive_but_mapped":
      return [
        numRight("id"),
        txt("name"),
        txt("department"),
        txt("category"),
        txt("subcategory"),
        numRight("productos"),
        { key: "ultimo_sync", header: "Último sync", render: (r) =>
          r.ultimo_sync ? dateTime(String(r.ultimo_sync)) : "—" },
      ];
    case "subcategories_without_product_type":
      return [
        numRight("id"),
        txt("subcategory"),
        txt("category"),
        txt("department"),
        { key: "productos_override", header: "Productos por override", align: "right",
          render: (r) => fmtCell(r.productos_override) },
      ];
    case "categories_without_subcategories":
      return [numRight("id"), txt("category"), txt("department")];
    case "departments_without_categories":
      return [numRight("id"), txt("department")];
    case "duplicate_product_type_names":
      return [
        txt("name"),
        numRight("count"),
        { key: "ids", header: "IDs en BSale", render: (r) => (
          <code className="font-mono text-xs">{
            Array.isArray(r.ids) ? r.ids.join(", ") : fmtCell(r.ids)
          }</code>
        )},
      ];
    case "products_without_classification":
      return [
        numRight("id"),
        txt("producto"),
        numRight("bsale_pt_id"),
        { key: "bsale_pt_name", header: "PT en BSale", render: (r) => fmtCell(r.bsale_pt_name) },
        { key: "bsale_pt_active", header: "PT activo BSale", render: (r) =>
          r.bsale_pt_active ? <Badge tone="success">Sí</Badge> : <Badge tone="neutral">No</Badge> },
        { key: "local_mapped", header: "Mapeado en BD", render: (r) =>
          r.local_mapped ? <Badge tone="success">Sí</Badge> : <Badge tone="danger">No</Badge> },
      ];
    default:
      return null; // → cae a auto-derivar columnas con Object.keys
  }
}

/* ─────────────────────── Sección de un issue ─────────────────────── */

export function IssueSection({
  issueKey,
  title,
  items,
  meta,
  open,
  onToggle,
}: {
  issueKey: string;
  title: string;
  items: Array<Record<string, unknown>>;
  meta: IssueMeta;
  open: boolean;
  onToggle: () => void;
}) {
  const style = SOURCE_STYLE[meta.source];
  const hasItems = items.length > 0;

  // Columnas curadas por tipo, fallback a auto-deriva si no las definimos
  const curated = colsForIssue(issueKey);
  const cols: RowCols =
    curated ?? (hasItems
      ? Object.keys(items[0]).map((k) => ({
          key: k,
          header: prettyHeader(k),
          align: typeof items[0][k] === "number" ? "right" : "left",
          render: (r: Record<string, unknown>) => fmtCell(r[k]),
        }))
      : []);

  return (
    <Card>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-2"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 text-faint transition-transform",
            open && "rotate-90",
          )}
        />
        <span className="text-sm font-medium text-fg">{title}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
            style.chip,
          )}
          title={style.label}
        >
          <style.icon className="h-3 w-3" />
          {style.short}
        </span>
        <Badge tone={hasItems ? "warning" : "success"} className="ml-auto">
          {items.length}
        </Badge>
      </button>
      {open && (
        <div className="border-t border-border p-4">
          {/* Bloque pedagógico: dónde está, qué significa, impacto, cómo arreglarlo */}
          <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg bg-surface-2/40 p-3 text-xs sm:grid-cols-2">
            <FactLine
              icon={style.icon}
              label="¿Dónde está el problema?"
              value={meta.where}
            />
            <FactLine
              icon={Info}
              label="¿Qué pasa?"
              value={meta.what}
            />
            {meta.impact && (
              <FactLine
                icon={AlertTriangle}
                label="Impacto"
                value={meta.impact}
              />
            )}
            {meta.fix_hint && (
              <FactLine
                icon={Lightbulb}
                label="Cómo arreglarlo"
                value={meta.fix_hint}
                action={
                  meta.fix_link ? (
                    <Link
                      href={meta.fix_link}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      Ir <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : null
                }
              />
            )}
          </div>

          {/* Datos del issue */}
          {hasItems ? (
            <DataTable columns={cols} rows={items} maxHeight="400px" />
          ) : (
            <EmptyState title="Sin elementos" />
          )}
        </div>
      )}
    </Card>
  );
}

function FactLine({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: typeof Info;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-faint" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-faint">
          {label}
        </p>
        <p className="text-xs leading-snug text-muted">
          {value}
          {action && <span className="ml-2">{action}</span>}
        </p>
      </div>
    </div>
  );
}
