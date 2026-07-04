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
    desc: "Piso seguro: fácil de superar",
    tone: "warning",
    getValue: (s) => s.meta_conservadora,
  },
  {
    key: "realista",
    label: "Realista",
    desc: "Lo esperable si el crecimiento se mantiene",
    tone: "info",
    getValue: (s) => s.meta_realista,
  },
  {
    key: "agresiva",
    label: "Agresiva",
    desc: "Exigente: requiere plan de acción",
    tone: "danger",
    getValue: (s) => s.meta_agresiva,
  },
];

/** Códigos de método del backend → explicación corta para el gerente. */
const METODO_LABEL: Record<string, string> = {
  yoy_mas_crecimiento_3m_promedio:
    "venta del mismo mes del año pasado + el crecimiento promedio de los últimos meses",
  yoy_directo: "venta del mismo mes del año pasado",
  promedio_historico: "promedio de los meses con datos",
};

function humanizarMetodo(metodo: string): string {
  return METODO_LABEL[metodo] ?? metodo.replaceAll("_", " ");
}

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
          subtitle={`Calculada sobre la ${humanizarMetodo(sug.metodo)}. El año pasado este mes se vendió ${money(sug.venta_yoy_mismo_mes)}; el crecimiento reciente es ${pct(sug.crecimiento_yoy_3m_pct)}.`}
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
            <span
              className="cursor-help text-muted underline decoration-dotted decoration-muted/40 underline-offset-2"
              title="Cantidad de meses con datos de ambos años usados para estimar el crecimiento. Con pocos meses de historia, tomá la sugerencia con cautela."
            >
              Basada en {sug.muestras_crecimiento}{" "}
              {sug.muestras_crecimiento === 1 ? "mes comparable" : "meses comparables"}
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
                había una meta cargada para este mes, se reemplaza. La meta se
                reparte en partes iguales entre las sucursales — podés ajustar
                el detalle en Configuración → Metas.
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
