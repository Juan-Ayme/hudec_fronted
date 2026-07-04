"use client";

import { useState } from "react";
import { AlertTriangle, Eye, Sparkles, X, Zap } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryTargetsPreview } from "@/lib/bi-types";
import { ROL_TARGET } from "@/features/bi/shared";
import type { useCatalogHealth } from "../hooks/useCatalogHealth";

/**
 * Banner grande que se muestra cuando `bloque_estable_80_20 === null`.
 * Ofrece dos acciones:
 *   1. Ver preview (mutation `previewCategoryTargets`) → abre modal read-only.
 *   2. Ejecutar bootstrap (mutation `bootstrapCategoryTargets`).
 * Si el backend responde 409 (ya hay filas), ofrece re-ejecutar con force=true.
 */
export function BootstrapPrompt({
  preview,
  bootstrap,
}: {
  preview: ReturnType<typeof useCatalogHealth>["preview"];
  bootstrap: ReturnType<typeof useCatalogHealth>["bootstrap"];
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<null | "safe" | "force">(null);

  const doPreview = () => {
    preview.mutate(undefined, {
      onSuccess: () => setPreviewOpen(true),
    });
  };

  const doBootstrap = (force: boolean) => {
    bootstrap.mutate(
      { force },
      {
        onSuccess: () => setConfirmOpen(null),
        onError: (err) => {
          const msg = err.message;
          if (!force && /409|ya hay/i.test(msg)) {
            setConfirmOpen("force");
          }
        },
      },
    );
  };

  return (
    <>
      <Card className="border-info/30 bg-info/8">
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-info/20 text-info">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-h3 font-bold text-fg">
              Activá las metas por categoría (80/20)
            </p>
            <p className="mt-1 text-caption text-fg/80">
              Aún no hay metas por categoría cargadas. El sistema puede analizar
              tus últimos 90 días de venta y sugerir metas y roles (motor / fijo
              / complemento / upsell) para cada categoría y sucursal. Podés ver
              la propuesta antes de aplicarla — nada se guarda hasta que
              confirmes.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={doPreview}
              loading={preview.isPending}
              className="border-info/40 text-info hover:bg-info/10"
            >
              <Eye className="h-4 w-4" aria-hidden="true" /> Ver preview
            </Button>
            <Button
              onClick={() => setConfirmOpen("safe")}
              className="bg-info text-white hover:bg-info/90"
            >
              <Zap className="h-4 w-4" aria-hidden="true" /> Ejecutar bootstrap
            </Button>
          </div>
        </CardBody>
      </Card>

      {previewOpen && preview.data && (
        <PreviewDialog
          data={preview.data}
          onClose={() => setPreviewOpen(false)}
          onExecute={() => {
            setPreviewOpen(false);
            setConfirmOpen("safe");
          }}
        />
      )}

      {confirmOpen === "safe" && (
        <ConfirmDialog
          title="Crear metas sugeridas"
          body="Se van a crear las metas por categoría sugeridas. Si ya existían metas cargadas, el sistema lo va a avisar y te ofreceremos recargarlas desde cero."
          confirmLabel="Crear metas"
          confirmTone="info"
          onCancel={() => setConfirmOpen(null)}
          onConfirm={() => doBootstrap(false)}
          loading={bootstrap.isPending}
        />
      )}

      {confirmOpen === "force" && (
        <ConfirmDialog
          title="⚠️ Borrar y recargar metas"
          body="Ya hay metas por categoría cargadas. Si continuás, se BORRAN todas las actuales (incluidas las editadas a mano) y se recargan las sugeridas desde cero."
          confirmLabel="Sí, borrar y recargar"
          confirmTone="danger"
          onCancel={() => setConfirmOpen(null)}
          onConfirm={() => doBootstrap(true)}
          loading={bootstrap.isPending}
        />
      )}
    </>
  );
}

function PreviewDialog({
  data,
  onClose,
  onExecute,
}: {
  data: CategoryTargetsPreview;
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
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-3">
          <div>
            <h3 className="text-h3 font-bold text-fg">
              Preview del bootstrap
            </h3>
            <p className="text-caption text-muted">
              {data.total_sugerencias} categorías sugeridas — nada se guardó.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border-soft bg-surface-2/40 px-5 py-3">
          <p className="text-caption font-semibold uppercase tracking-wider text-faint">
            Criterios
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {Object.entries(data.criterios).map(([k, v]) => (
              <span
                key={k}
                className="rounded-md border border-border-soft bg-surface-3 px-2 py-0.5 font-mono text-[0.65rem] text-fg"
              >
                {k}: <span className="text-primary">{String(v)}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-caption">
            <thead className="sticky top-0 bg-surface-2/95 backdrop-blur-md">
              <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
                <th className="px-4 py-2 text-left font-semibold">Categoría</th>
                <th className="px-4 py-2 text-left font-semibold">Sucursal</th>
                <th className="px-4 py-2 text-left font-semibold">Rol</th>
                <th className="px-4 py-2 text-right font-semibold">Meta</th>
                <th className="px-4 py-2 text-right font-semibold">Margen%</th>
                <th className="px-4 py-2 text-right font-semibold">SKUs</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((t, i) => {
                const rol = ROL_TARGET[t.rol];
                return (
                  <tr
                    key={`${t.category_id}-${t.bsale_office_id}-${i}`}
                    className="border-b border-border-soft/50 hover:bg-surface-2/40"
                  >
                    <td className="px-4 py-2">
                      <p className="truncate font-semibold text-fg">
                        {t.categoria}
                      </p>
                      <p className="truncate text-[0.6rem] text-faint">
                        {t.departamento}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-fg">{t.sucursal}</td>
                    <td className="px-4 py-2">
                      <Badge tone={rol.tone}>{rol.label}</Badge>
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">
                      {money(t.meta_mensual_pen)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">
                      {t.margen_objetivo_pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                      {t.skus_min}–{t.skus_max}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-soft bg-surface-2/60 px-5 py-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onExecute}
            className="bg-info text-white hover:bg-info/90"
          >
            <Zap className="h-4 w-4" aria-hidden="true" /> Ejecutar bootstrap
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  confirmTone,
  onCancel,
  onConfirm,
  loading,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  confirmTone: "info" | "danger";
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
      <Card
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                confirmTone === "danger"
                  ? "bg-danger/15 text-danger"
                  : "bg-info/15 text-info",
              )}
            >
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-body font-bold text-fg">{title}</h3>
              <p className="mt-1 text-caption text-muted">{body}</p>
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              loading={loading}
              className={
                confirmTone === "danger"
                  ? "bg-danger text-white hover:bg-danger/90"
                  : "bg-info text-white hover:bg-info/90"
              }
            >
              {confirmLabel}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
