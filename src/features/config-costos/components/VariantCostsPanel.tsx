"use client";

import { useState } from "react";
import {
  AlertTriangle,
  DollarSign,
  Eye,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VariantCostBackfillResult } from "@/lib/bi-types";
import { COBERTURA } from "@/features/bi/shared";
import { useVariantCosts } from "../hooks/useVariantCosts";

/**
 * Panel admin de /configuracion?tab=costos: KPIs de auditoría de costos
 * + botones "Simular backfill" (dry_run=true) y "Ejecutar backfill".
 */
export function VariantCostsPanel() {
  const { audit, backfill } = useVariantCosts();
  const [preview, setPreview] = useState<VariantCostBackfillResult | null>(null);
  const [confirmExec, setConfirmExec] = useState(false);

  const handleDryRun = () => {
    backfill.mutate(true, {
      onSuccess: (data) => setPreview(data),
    });
  };

  const handleExec = () => {
    backfill.mutate(false, {
      onSuccess: () => {
        setPreview(null);
        setConfirmExec(false);
      },
    });
  };

  if (audit.isError) return <ErrorState error={audit.error} />;
  if (audit.isLoading || !audit.data)
    return <LoadingState label="Auditando costos…" />;

  const a = audit.data;
  const cob = a.ventas_ultimos_90d.cobertura_costos_pct;
  const estado =
    cob >= 90 ? "OK" : cob >= 70 ? "ADVERTENCIA" : "CRITICA";
  const meta = COBERTURA[estado];
  const Icon = meta.icon;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          eyebrow="Admin · Costos de variantes"
          title={
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-warning" />
              Cobertura de costos: {pct(cob)}
            </span>
          }
          subtitle={a.diagnostico}
          action={
            <Badge tone={meta.tone} className="gap-1">
              <Icon className="h-3 w-3" aria-hidden="true" />
              {meta.label}
            </Badge>
          }
        />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-caption font-bold uppercase tracking-wider text-faint">
              Variantes activas
            </p>
            <div className="grid grid-cols-2 gap-2">
              <MiniKpi
                label="Total"
                value={num(a.variantes.total_activas)}
              />
              <MiniKpi
                label="Con costo"
                value={num(a.variantes.con_costo)}
                sub={pct(a.variantes.pct_cobertura)}
                tone="success"
              />
              <MiniKpi
                label="Sin costo"
                value={num(a.variantes.sin_costo)}
                tone="warning"
              />
              <MiniKpi
                label="Recuperables"
                value={num(a.variantes.recuperables)}
                sub={
                  a.variantes.irrecuperables > 0
                    ? `${num(a.variantes.irrecuperables)} irrec.`
                    : undefined
                }
                tone="info"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-caption font-bold uppercase tracking-wider text-faint">
              Ventas últimos 90d
            </p>
            <div className="grid grid-cols-2 gap-2">
              <MiniKpi
                label="Venta total"
                value={money(a.ventas_ultimos_90d.venta_total)}
              />
              <MiniKpi
                label="Con costo"
                value={money(a.ventas_ultimos_90d.venta_con_costo)}
                sub={pct(a.ventas_ultimos_90d.cobertura_costos_pct)}
                tone="success"
              />
              <MiniKpi
                label="Sin costo"
                value={money(a.ventas_ultimos_90d.venta_sin_costo)}
                sub={pct(a.ventas_ultimos_90d.venta_sin_costo_pct)}
                tone="warning"
              />
              <MiniKpi
                label="Recuperable"
                value={money(a.ventas_ultimos_90d.venta_recuperable)}
                sub={pct(a.ventas_ultimos_90d.venta_recuperable_pct)}
                tone="info"
              />
            </div>
          </div>
        </CardBody>

        <div className="flex flex-col gap-3 border-t border-border-soft bg-surface-2/40 px-5 py-4">
          <p className="text-caption text-fg">
            Backfill: recupera costos faltantes desde{" "}
            <code className="rounded bg-surface-3 px-1 font-mono text-[0.6rem]">
              reception_details
            </code>
            . Es idempotente. Recomendado ejecutar el simulador primero.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleDryRun}
              loading={backfill.isPending && backfill.variables === true}
              disabled={backfill.isPending}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Simular backfill (dry run)
            </Button>
            <Button
              onClick={() => setConfirmExec(true)}
              disabled={backfill.isPending}
              className="bg-warning text-white hover:bg-warning/90"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Ejecutar backfill
            </Button>
          </div>
        </div>
      </Card>

      {preview && (
        <PreviewDialog
          data={preview}
          onClose={() => setPreview(null)}
          onExecute={() => {
            setPreview(null);
            setConfirmExec(true);
          }}
        />
      )}

      {confirmExec && (
        <ConfirmExecDialog
          onCancel={() => setConfirmExec(false)}
          onConfirm={handleExec}
          loading={backfill.isPending}
        />
      )}
    </div>
  );
}

function MiniKpi({
  label,
  value,
  sub,
  tone = "info",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "info" | "success" | "warning";
}) {
  const cls = {
    info: "text-fg",
    success: "text-success",
    warning: "text-warning",
  }[tone];
  return (
    <div className="rounded-md border border-border-soft bg-surface-2/40 px-3 py-2">
      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-faint">
        {label}
      </p>
      <p className={cn("font-mono text-body font-bold tabular-nums", cls)}>
        {value}
      </p>
      {sub && (
        <p className="font-mono text-[0.65rem] tabular-nums text-faint">{sub}</p>
      )}
    </div>
  );
}

function PreviewDialog({
  data,
  onClose,
  onExecute,
}: {
  data: VariantCostBackfillResult;
  onClose: () => void;
  onExecute: () => void;
}) {
  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-3">
          <div>
            <h3 className="text-body font-bold text-fg">
              Preview del backfill (dry run)
            </h3>
            <p className="text-caption text-muted">
              {data.candidatos_total} candidatos · {data.actualizados}{" "}
              actualizarían · {data.saltados_sin_recep} saltados sin recepción.
              Nada se guardó.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="border-b border-border-soft bg-surface-2/50 px-5 py-2 text-caption text-fg/80">
          {data.nota}
        </p>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {data.sample && data.sample.length > 0 ? (
            <table className="w-full text-caption">
              <thead className="sticky top-0 bg-surface-2/95 backdrop-blur-md">
                <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
                  <th className="px-4 py-2 text-left font-semibold">SKU / Variant</th>
                  <th className="px-4 py-2 text-right font-semibold">Costo actual</th>
                  <th className="px-4 py-2 text-right font-semibold">Costo nuevo</th>
                  <th className="px-4 py-2 text-left font-semibold">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {data.sample.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-border-soft/50 hover:bg-surface-2/40"
                  >
                    <td className="px-4 py-2 text-fg">
                      {String(row.sku ?? row.variant_id ?? "—")}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                      {row.costo_actual != null ? money(row.costo_actual) : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums font-bold text-success">
                      {money(row.costo_nuevo)}
                    </td>
                    <td className="px-4 py-2 text-[0.7rem] text-muted">
                      {row.fuente ?? "recepciones"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-center text-caption text-faint">
              No hay cambios pendientes.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-soft bg-surface-2/60 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          {data.actualizados > 0 && (
            <Button
              onClick={onExecute}
              className="bg-warning text-white hover:bg-warning/90"
            >
              <Play className="h-4 w-4" aria-hidden="true" /> Ejecutar en real
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function ConfirmExecDialog({
  onCancel,
  onConfirm,
  loading,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-body font-bold text-fg">
                Ejecutar backfill de costos
              </h3>
              <p className="mt-1 text-caption text-muted">
                Va a actualizar la tabla{" "}
                <code className="rounded bg-surface-3 px-1 font-mono text-[0.6rem]">
                  variant_costs
                </code>{" "}
                con los costos derivados de recepciones. Idempotente y
                reversible — no borra datos, solo llena huecos.
              </p>
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              loading={loading}
              className="bg-warning text-white hover:bg-warning/90"
            >
              <DollarSign className="h-4 w-4" aria-hidden="true" /> Ejecutar
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
