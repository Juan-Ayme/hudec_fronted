"use client";

import { useState } from "react";
import { AlertTriangle, Sparkles, Target, X, Zap } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SugerenciaProximoMes, SugerenciaNivel } from "@/lib/bi-types";
import { formatMes } from "@/features/bi/shared";

const NIVELES: {
  key: SugerenciaNivel;
  label: string;
  desc: string;
  tone: "warning" | "info" | "danger";
  getValue: (s: SugerenciaProximoMes) => number;
}[] = [
  {
    key: "conservadora",
    label: "Conservadora",
    desc: "Fácil de superar, low risk",
    tone: "warning",
    getValue: (s) => s.meta_conservadora,
  },
  {
    key: "realista",
    label: "Realista",
    desc: "YoY + crecimiento probable",
    tone: "info",
    getValue: (s) => s.meta_realista,
  },
  {
    key: "agresiva",
    label: "Agresiva",
    desc: "Requiere plan de acción",
    tone: "danger",
    getValue: (s) => s.meta_agresiva,
  },
];

const TONE_STYLES = {
  info: {
    border: "border-info/40",
    bg: "bg-info/6",
    text: "text-info",
    button: "bg-info text-white hover:bg-info/90",
  },
  warning: {
    border: "border-warning/40",
    bg: "bg-warning/6",
    text: "text-warning",
    button: "bg-warning text-white hover:bg-warning/90",
  },
  danger: {
    border: "border-danger/40",
    bg: "bg-danger/6",
    text: "text-danger",
    button: "bg-danger text-white hover:bg-danger/90",
  },
} as const;

/**
 * 3 cards con los 3 niveles de meta sugerida. La recomendada por el backend
 * queda resaltada con ring. Cada card tiene botón "Guardar como meta".
 */
export function SugerenciaMetaSection({
  sug,
  onSave,
  saving,
}: {
  sug: SugerenciaProximoMes;
  onSave: (nivel: SugerenciaNivel, monto: number) => void;
  saving: boolean;
}) {
  const [confirm, setConfirm] = useState<null | { nivel: SugerenciaNivel; monto: number }>(null);
  return (
    <>
      <Card>
        <CardHeader
          eyebrow={`Sugerencia · ${formatMes(sug.mes_objetivo)}`}
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-info" />
              Meta sugerida para {formatMes(sug.mes_objetivo)}
            </span>
          }
          subtitle={`Método: ${sug.metodo} · YoY ${money(sug.venta_yoy_mismo_mes)} · crecimiento 3m ${pct(sug.crecimiento_yoy_3m_pct)}`}
        />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-3">
            {NIVELES.map((n) => {
              const isRec = sug.recomendacion === n.key;
              const styles = TONE_STYLES[n.tone];
              const monto = n.getValue(sug);
              return (
                <div
                  key={n.key}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border p-4",
                    styles.border,
                    styles.bg,
                    isRec && "shadow-[0_0_0_2px_var(--color-info)_inset]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn("text-caption font-bold uppercase tracking-wider", styles.text)}>
                        {n.label}
                      </p>
                      <p className="text-[0.65rem] text-faint">{n.desc}</p>
                    </div>
                    {isRec && (
                      <span className="rounded-full border border-info/40 bg-info/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-info">
                        Recomendada
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-fg">
                    {money(monto)}
                  </p>
                  <Button
                    onClick={() => setConfirm({ nivel: n.key, monto })}
                    className={styles.button}
                    size="sm"
                    disabled={saving}
                  >
                    <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                    Guardar como meta
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border-soft pt-3 text-caption">
            <span className="text-muted">
              <Target className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              Mejor mes histórico:{" "}
              <span className="font-semibold text-fg">
                {money(sug.mejor_mes_historico)}
              </span>
            </span>
            <span className="text-muted">
              Muestras crecimiento:{" "}
              <span className="font-semibold text-fg">
                {sug.muestras_crecimiento}
              </span>
            </span>
          </div>
        </CardBody>
      </Card>

      {confirm && (
        <ConfirmSaveDialog
          nivel={confirm.nivel}
          monto={confirm.monto}
          mes={sug.mes_objetivo}
          saving={saving}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            onSave(confirm.nivel, confirm.monto);
            setConfirm(null);
          }}
        />
      )}
    </>
  );
}

function ConfirmSaveDialog({
  nivel,
  monto,
  mes,
  saving,
  onCancel,
  onConfirm,
}: {
  nivel: SugerenciaNivel;
  monto: number;
  mes: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-3">
          <h3 className="text-body font-bold text-fg">Guardar meta</h3>
          <button
            onClick={onCancel}
            className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-info" aria-hidden="true" />
            <div>
              <p className="text-body text-fg">
                Se va a guardar como meta de{" "}
                <span className="font-bold">{formatMes(mes)}</span>:
              </p>
              <p className="mt-1 font-mono text-h3 font-bold tabular-nums text-fg">
                {money(monto)}
              </p>
              <p className="mt-1 text-caption text-muted">
                Nivel: <span className="font-semibold">{nivel}</span>. Si ya
                había meta cargada para este mes, se reemplaza. La distribución
                por sucursal es proporcional a la venta actual.
              </p>
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              loading={saving}
              className="bg-info text-white hover:bg-info/90"
            >
              Guardar
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
