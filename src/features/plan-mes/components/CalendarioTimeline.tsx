"use client";

import { CalendarDays, Sparkles } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CalendarioMes } from "@/lib/bi-types";
import { formatMes } from "@/features/bi/shared";
import type { MesesCalendario } from "../hooks/usePlan";

/** Timeline horizontal scrolleable con los próximos N meses. */
export function CalendarioTimeline({
  meses,
  currentSelection,
  onChangeSelection,
}: {
  meses: CalendarioMes[];
  currentSelection: MesesCalendario;
  onChangeSelection: (v: MesesCalendario) => void;
}) {
  return (
    <Card>
      <CardHeader
        eyebrow="Calendario de campañas"
        title={
          <span className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-violet" />
            Próximos {meses.length} meses
          </span>
        }
        action={
          <div className="inline-flex overflow-hidden rounded-md border border-border-soft bg-surface-2">
            {[3, 6, 12].map((n) => (
              <button
                key={n}
                onClick={() => onChangeSelection(n as MesesCalendario)}
                className={cn(
                  "px-2.5 py-1 text-caption font-semibold transition-colors",
                  currentSelection === n
                    ? "bg-violet text-white"
                    : "text-muted hover:bg-surface-3 hover:text-fg",
                )}
              >
                {n}m
              </button>
            ))}
          </div>
        }
      />
      <CardBody className="p-0">
        {meses.length === 0 ? (
          <p className="p-6 text-center text-caption text-faint">
            Sin campañas próximas.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto p-4 custom-scrollbar">
            {meses.map((m) => (
              <MesCard key={m.mes} m={m} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function MesCard({ m }: { m: CalendarioMes }) {
  return (
    <div className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border border-border-soft bg-surface-2/40 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-caption font-bold uppercase tracking-wider text-violet">
            {formatMes(m.mes)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-caption font-semibold text-fg">
            {m.campana_principal}
          </p>
        </div>
      </div>

      {m.categoria_protagonista && (
        <div className="rounded-md border border-border-soft bg-surface p-2">
          <p className="flex items-center gap-1 text-[0.55rem] font-bold uppercase tracking-wider text-faint">
            <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
            Protagonista
          </p>
          <p className="mt-0.5 truncate text-caption font-semibold text-fg">
            {m.categoria_protagonista.categoria}
          </p>
          <p className="truncate text-[0.6rem] text-faint">
            {m.categoria_protagonista.departamento} · YoY{" "}
            {money(m.categoria_protagonista.venta_yoy)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <MetaChip label="Cons." value={m.meta_conservadora} tone="warning" />
        <MetaChip label="Real." value={m.meta_realista} tone="info" />
        <MetaChip label="Agr." value={m.meta_agresiva} tone="danger" />
      </div>

      <p className="border-t border-border-soft pt-1.5 text-[0.6rem] text-faint">
        YoY {money(m.venta_yoy)}
      </p>
    </div>
  );
}

const CHIP_TONE = {
  warning: "bg-warning/12 text-warning",
  info: "bg-info/12 text-info",
  danger: "bg-danger/12 text-danger",
} as const;

function MetaChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof CHIP_TONE;
}) {
  return (
    <div className={cn("rounded-md px-1 py-1", CHIP_TONE[tone])}>
      <p className="text-[0.5rem] font-bold uppercase tracking-wider">{label}</p>
      <p className="font-mono text-[0.65rem] tabular-nums font-bold">
        {money(value)}
      </p>
    </div>
  );
}
