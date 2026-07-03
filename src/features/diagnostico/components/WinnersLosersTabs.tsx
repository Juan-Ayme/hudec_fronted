"use client";

import { useState } from "react";
import { Snowflake, Sprout, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  DiagnosisSkuMov,
  DiagnosisWinnersLosers,
} from "@/lib/bi-types";
import { deltaTone, formatDeltaPct } from "@/features/bi/shared";

type WLKey = "subieron" | "cayeron" | "nuevos" | "enfriados";

const TABS: {
  id: WLKey;
  label: string;
  short: string;
  icon: LucideIcon;
  tone: "success" | "danger" | "info" | "warning";
  getRows: (w: DiagnosisWinnersLosers) => DiagnosisSkuMov[];
}[] = [
  { id: "subieron",  label: "Top que subieron",     short: "Subieron",  icon: TrendingUp,   tone: "success", getRows: (w) => w.top_subieron },
  { id: "cayeron",   label: "Top que cayeron",      short: "Cayeron",   icon: TrendingDown, tone: "danger",  getRows: (w) => w.top_cayeron },
  { id: "nuevos",    label: "Nuevos con tracción",  short: "Nuevos",    icon: Sprout,       tone: "info",    getRows: (w) => w.skus_nuevos_con_traccion },
  { id: "enfriados", label: "Se enfriaron",         short: "Enfriados", icon: Snowflake,    tone: "warning", getRows: (w) => w.skus_que_se_enfriaron },
];

const toneClasses = {
  success: { bgActive: "bg-success/12 text-success", pill: "text-success" },
  danger:  { bgActive: "bg-danger/12 text-danger",   pill: "text-danger" },
  info:    { bgActive: "bg-info/12 text-info",       pill: "text-info" },
  warning: { bgActive: "bg-warning/12 text-warning", pill: "text-warning" },
} as const;

/** SKUs top que subieron/cayeron + nuevos + enfriados, en 4 tabs. */
export function WinnersLosersTabs({
  ganadores,
}: {
  ganadores: DiagnosisWinnersLosers;
}) {
  const [tab, setTab] = useState<WLKey>("cayeron");
  const spec = TABS.find((t) => t.id === tab)!;
  const rows = spec.getRows(ganadores);

  return (
    <Card>
      <CardHeader
        eyebrow="Movimientos por SKU"
        title="Ganadores y perdedores"
      />
      <div className="flex flex-wrap gap-1 border-b border-border-soft px-3 py-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          const cls = toneClasses[t.tone];
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-caption font-semibold transition-colors",
                isActive
                  ? cls.bgActive
                  : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.short}
              <span className="rounded-full bg-surface-3 px-1.5 py-0 font-mono text-[0.6rem] tabular-nums">
                {t.getRows(ganadores).length}
              </span>
            </button>
          );
        })}
      </div>
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-caption text-faint">
            Sin SKUs en esta categoría.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <table className="w-full text-caption">
              <thead className="sticky top-0 bg-surface-2/95 backdrop-blur-md">
                <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
                  <th className="px-4 py-2 text-left font-semibold">SKU · Producto</th>
                  <th className="px-4 py-2 text-right font-semibold">Actual</th>
                  <th className="px-4 py-2 text-right font-semibold">Previo</th>
                  <th className="px-4 py-2 text-right font-semibold">Δ%</th>
                  <th className="px-4 py-2 text-right font-semibold">Δ S/</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const tone = deltaTone(r.delta_pct);
                  const toneCls = {
                    success: "text-success",
                    danger: "text-danger",
                    warning: "text-warning",
                    neutral: "text-fg",
                    info: "text-info",
                    primary: "text-primary",
                    violet: "text-violet",
                  }[tone];
                  return (
                    <tr
                      key={`${r.sku}-${i}`}
                      className="border-b border-border-soft/50 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-2">
                        <p className="truncate font-semibold text-fg">{r.producto}</p>
                        <p className="font-mono text-[0.65rem] text-faint">
                          {r.sku}
                          {r.sucursal ? ` · ${r.sucursal}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">
                        {money(r.ventas_actual)}
                        {r.unds_actual != null && (
                          <span className="ml-1 text-[0.6rem] text-faint">
                            ({num(r.unds_actual)}u)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                        {money(r.ventas_prev)}
                        {r.unds_prev != null && (
                          <span className="ml-1 text-[0.6rem] text-faint">
                            ({num(r.unds_prev)}u)
                          </span>
                        )}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2 text-right font-mono tabular-nums font-semibold",
                          toneCls,
                        )}
                      >
                        {formatDeltaPct(r.delta_pct)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2 text-right font-mono tabular-nums",
                          r.delta_abs > 0
                            ? "text-success"
                            : r.delta_abs < 0
                            ? "text-danger"
                            : "text-fg",
                        )}
                      >
                        {r.delta_abs > 0 ? "+" : r.delta_abs < 0 ? "−" : ""}
                        {money(Math.abs(r.delta_abs))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
