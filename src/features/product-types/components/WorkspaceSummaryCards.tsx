"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Trash2,
} from "lucide-react";
import { KpiStat } from "@/components/ui/kpi-stat";
import { num } from "@/lib/format";
import type { ProductTypesWorkspaceSummary } from "@/lib/types";

interface WorkspaceSummaryCardsProps {
  summary: ProductTypesWorkspaceSummary | undefined;
  isLoading: boolean;
  activeTray: "unmapped_with_products" | "unmapped_empty" | "mapped";
  onSelectTray: (tray: "unmapped_with_products" | "unmapped_empty" | "mapped") => void;
}

export function WorkspaceSummaryCards({
  summary,
  isLoading,
  activeTray,
  onSelectTray,
}: WorkspaceSummaryCardsProps) {
  if (!summary && !isLoading) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Requieren Mapeo (Urgente) */}
      <button
        type="button"
        onClick={() => onSelectTray("unmapped_with_products")}
        className="text-left focus:outline-none"
      >
        <div
          className={`h-full rounded-2xl border transition-all ${
            activeTray === "unmapped_with_products"
              ? "border-danger ring-2 ring-danger/30 shadow-lg scale-[1.01]"
              : "border-border-soft hover:border-border"
          }`}
        >
          <KpiStat
            label="Requieren Mapeo"
            value={summary ? num(summary.unmapped_with_products_count) : "—"}
            sub={
              summary
                ? `${num(summary.products_without_classification_count)} productos huérfanos`
                : undefined
            }
            icon={AlertTriangle}
            tone={
              summary && summary.unmapped_with_products_count > 0
                ? "danger"
                : "success"
            }
            loading={isLoading}
          />
        </div>
      </button>

      {/* 2. Vacíos a Depurar */}
      <button
        type="button"
        onClick={() => onSelectTray("unmapped_empty")}
        className="text-left focus:outline-none"
      >
        <div
          className={`h-full rounded-2xl border transition-all ${
            activeTray === "unmapped_empty"
              ? "border-warning ring-2 ring-warning/30 shadow-lg scale-[1.01]"
              : "border-border-soft hover:border-border"
          }`}
        >
          <KpiStat
            label="Vacíos para Limpiar"
            value={summary ? num(summary.unmapped_empty_count) : "—"}
            sub="0 productos · listos para borrar"
            icon={Trash2}
            tone={
              summary && summary.unmapped_empty_count > 0
                ? "warning"
                : "neutral"
            }
            loading={isLoading}
          />
        </div>
      </button>

      {/* 3. Catálogo Mapeado */}
      <button
        type="button"
        onClick={() => onSelectTray("mapped")}
        className="text-left focus:outline-none"
      >
        <div
          className={`h-full rounded-2xl border transition-all ${
            activeTray === "mapped"
              ? "border-success ring-2 ring-success/30 shadow-lg scale-[1.01]"
              : "border-border-soft hover:border-border"
          }`}
        >
          <KpiStat
            label="Tipos Mapeados"
            value={summary ? num(summary.mapped_count) : "—"}
            sub={
              summary
                ? `${num(summary.naming_mismatches_count)} con nombre a estandarizar`
                : undefined
            }
            icon={CheckCircle2}
            tone="success"
            loading={isLoading}
          />
        </div>
      </button>

      {/* 4. Total en BSale */}
      <div className="h-full rounded-2xl border border-border-soft">
        <KpiStat
          label="Total en BSale"
          value={summary ? num(summary.total_product_types) : "—"}
          sub={
            summary
              ? `${num(summary.active_product_types)} activos · ${num(
                  summary.inactive_product_types,
                )} inactivos`
              : undefined
          }
          icon={Layers}
          tone="primary"
          loading={isLoading}
        />
      </div>
    </div>
  );
}

