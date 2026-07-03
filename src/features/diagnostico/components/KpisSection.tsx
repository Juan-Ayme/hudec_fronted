"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  DiagnosisKpis,
  DiagnosisKpisComparativa,
} from "@/lib/bi-types";
import {
  TotalRecurrentePair,
  deltaTone,
  formatDeltaMoney,
  formatDeltaPct,
} from "@/features/bi/shared";

/**
 * KPIs de la ventana actual + tabs de comparativas (vs semana ant, vs 4 sem,
 * vs YoY). Cada comparativa muestra delta_abs y delta_pct para Total y
 * Recurrente por separado.
 */
export function KpisSection({ kpis }: { kpis: DiagnosisKpis }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <KpisActual kpis={kpis} />
      <ComparativasTabs kpis={kpis} />
    </div>
  );
}

function KpisActual({ kpis }: { kpis: DiagnosisKpis }) {
  const a = kpis.actual;
  return (
    <Card>
      <CardHeader
        eyebrow="Ventana actual"
        title={
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {a.from} → {a.to}
          </span>
        }
      />
      <CardBody className="grid grid-cols-2 gap-5 md:grid-cols-4">
        <TotalRecurrentePair
          label="Ventas"
          total={a.ventas_total}
          recurrente={a.ventas_recurrente}
          size="md"
        />
        <KpiLine label="Tickets" value={num(a.tickets)} sub={`${num(a.unds)} unds`} />
        <KpiLine
          label="Ticket promedio"
          value={money(a.ticket_promedio)}
          sub={`Descuento ${pct(a.descuento_pct)}`}
        />
        <div className="flex flex-col gap-0.5">
          <p className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
            Margen
          </p>
          <p className="text-lg font-bold tabular-nums tracking-tight text-fg">
            {pct(a.margen_pct_total)}
          </p>
          <p className="text-[0.7rem] tabular-nums text-faint">
            {pct(a.margen_pct_recurrente)}{" "}
            <span className="text-muted/70">recurrente</span>
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

function KpiLine({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums tracking-tight text-fg">
        {value}
      </p>
      {sub && <p className="text-[0.7rem] tabular-nums text-faint">{sub}</p>}
    </div>
  );
}

type TabKey = "semana" | "cuatro" | "yoy";
const TABS: { id: TabKey; label: string; short: string; getData: (k: DiagnosisKpis) => DiagnosisKpisComparativa }[] = [
  { id: "semana", label: "vs semana anterior",   short: "Semana",  getData: (k) => k.vs_semana_anterior },
  { id: "cuatro", label: "vs promedio 4 semanas", short: "4 sem",   getData: (k) => k.vs_promedio_4_semanas },
  { id: "yoy",    label: "vs año anterior",       short: "YoY",     getData: (k) => k.vs_ano_anterior },
];

function ComparativasTabs({ kpis }: { kpis: DiagnosisKpis }) {
  const [tab, setTab] = useState<TabKey>("semana");
  const data = TABS.find((t) => t.id === tab)!.getData(kpis);

  return (
    <Card>
      <div className="flex items-center gap-1 border-b border-border-soft px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-caption font-semibold transition-colors",
              tab === t.id
                ? "bg-primary/12 text-primary"
                : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {t.short}
          </button>
        ))}
      </div>
      <CardBody className="flex flex-col gap-3">
        <p className="text-caption text-faint">
          Actual vs <span className="font-semibold text-fg">{data.label}</span>
          {" · "}
          {data.from} → {data.to}
        </p>
        <DeltaFila
          label="Ventas total"
          delta_abs={data.delta_abs_total}
          delta_pct={data.delta_pct_total}
          prev={data.ventas_total}
        />
        <DeltaFila
          label="Ventas recurrente"
          delta_abs={data.delta_abs_recurrente}
          delta_pct={data.delta_pct_recurrente}
          prev={data.ventas_recurrente}
          highlight
        />
        <DeltaFila
          label="Tickets"
          delta_abs={kpis.actual.tickets - data.tickets}
          delta_pct={
            data.tickets > 0
              ? ((kpis.actual.tickets - data.tickets) / data.tickets) * 100
              : null
          }
          prev={data.tickets}
          isNum
        />
      </CardBody>
    </Card>
  );
}

function DeltaFila({
  label,
  delta_abs,
  delta_pct,
  prev,
  isNum = false,
  highlight = false,
}: {
  label: string;
  delta_abs: number;
  delta_pct: number | null;
  prev: number;
  isNum?: boolean;
  highlight?: boolean;
}) {
  const tone = deltaTone(delta_pct);
  const cls = {
    success: "text-success",
    danger: "text-danger",
    warning: "text-warning",
    neutral: "text-fg",
    info: "text-info",
    primary: "text-primary",
    violet: "text-violet",
  }[tone];
  // Para tickets `isNum`, delta_abs viene precomputado positivo si subió.
  const deltaLabel = isNum
    ? (delta_abs > 0 ? "+" : delta_abs < 0 ? "−" : "") + num(Math.abs(delta_abs))
    : formatDeltaMoney(delta_abs);
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
        highlight
          ? "border-primary/25 bg-primary/6"
          : "border-border-soft bg-surface-2/40",
      )}
    >
      <div className="min-w-0">
        <p className="text-caption font-semibold text-fg">{label}</p>
        <p className="text-[0.65rem] text-faint">
          {isNum ? num(prev) : money(prev)} previo
        </p>
      </div>
      <div className="flex flex-col items-end">
        <span className={cn("font-mono text-body font-bold tabular-nums", cls)}>
          {formatDeltaPct(delta_pct)}
        </span>
        <span className={cn("font-mono text-[0.7rem] tabular-nums", cls)}>
          {deltaLabel}
        </span>
      </div>
    </div>
  );
}
