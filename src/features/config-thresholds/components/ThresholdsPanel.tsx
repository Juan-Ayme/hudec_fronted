"use client";

import { useState } from "react";
import { Check, Save, RotateCcw } from "lucide-react";
import { type ThresholdSection } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { useThresholds } from "../hooks/useThresholds";

export function ThresholdsPanel() {
  const { cfg, mutation } = useThresholds();

  // Estado local del formulario. Sincroniza con el server durante el render.
  const [values, setValues] = useState<Record<string, number>>({});
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const dataKey = cfg.data ? JSON.stringify(cfg.data.thresholds) : null;
  if (cfg.data && dataKey !== syncedKey) {
    setSyncedKey(dataKey);
    setValues({ ...cfg.data.thresholds });
  }

  if (cfg.isError) return <ErrorState error={cfg.error} />;
  if (cfg.isLoading || !cfg.data) return <LoadingState label="Cargando umbrales…" />;

  const original = cfg.data.thresholds;
  const defaults = cfg.data.defaults;
  const sections = cfg.data.sections;

  const changedKeys = Object.keys(values).filter(
    (k) => values[k] !== original[k],
  );
  const changed = changedKeys.length > 0;

  const restoreSection = (section: ThresholdSection) => {
    setValues((prev) => {
      const next = { ...prev };
      for (const f of section.fields) next[f.key] = defaults[f.key];
      return next;
    });
  };

  const update = (key: string, raw: string) => {
    // Permitir vacío momentáneo (NaN) sin perder el foco; guardar solo si parsea.
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n)) return;
    setValues((prev) => ({ ...prev, [key]: n }));
  };

  const saveBtn = (
    <Button
      onClick={() =>
        mutation.mutate(
          Object.fromEntries(changedKeys.map((k) => [k, values[k]])),
        )
      }
      disabled={!changed || mutation.isPending}
    >
      <Save className="h-4 w-4" />
      {mutation.isPending ? "Guardando…" : `Guardar (${changedKeys.length})`}
    </Button>
  );

  return (
    <div>
      <div className="mb-4 rounded-lg border border-warning/30 bg-warning-dim/30 px-4 py-3 text-sm text-warning">
        <strong>Heads up:</strong> hoy estos valores se guardan en la base de
        datos pero los SQL de las matrices todavía tienen los números hardcoded.
        Editar aquí persiste el cambio pero aún <em>no</em> afecta los reportes
        — ese conector queda para una siguiente iteración con tests de
        regresión.
      </div>

      <div className="space-y-4">
        {sections.map((sec) => {
          const sectionChanged = sec.fields.some(
            (f) => values[f.key] !== original[f.key],
          );
          const sectionAtDefault = sec.fields.every(
            (f) => values[f.key] === defaults[f.key],
          );
          return (
            <Card key={sec.key}>
              <CardHeader
                title={sec.title}
                subtitle={sec.description}
                action={
                  <Button
                    onClick={() => restoreSection(sec)}
                    disabled={sectionAtDefault}
                    title="Volver a los valores por defecto del sistema"
                  >
                    <RotateCcw className="h-4 w-4" /> Restaurar defaults
                  </Button>
                }
              />
              <CardBody>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sec.fields.map((f) => {
                    const current = values[f.key];
                    const def = defaults[f.key];
                    const isChanged = current !== original[f.key];
                    const isDefault = current === def;
                    return (
                      <label key={f.key} className="flex flex-col gap-1.5">
                        <span className="flex items-center justify-between text-caption font-semibold uppercase tracking-[0.08em] text-muted">
                          <span>{f.label}</span>
                          {isChanged && (
                            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[0.62rem] normal-case tracking-normal text-primary">
                              editado
                            </span>
                          )}
                        </span>
                        <Input
                          type="number"
                          step="any"
                          value={Number.isFinite(current) ? current : ""}
                          onChange={(e) => update(f.key, e.target.value)}
                        />
                        <span className="text-caption text-faint">
                          {f.help}
                          {!isDefault && (
                            <>
                              {" · "}
                              <button
                                type="button"
                                className="text-primary underline-offset-2 hover:underline"
                                onClick={() =>
                                  setValues((p) => ({ ...p, [f.key]: def }))
                                }
                                title={`Volver a ${def}`}
                              >
                                default: {def}
                              </button>
                            </>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {sectionChanged && (
                  <p className="mt-3 text-xs text-warning">
                    Esta sección tiene cambios sin guardar.
                  </p>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-3 mt-6 flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-surface/95 px-4 py-3 backdrop-blur">
        <p className="text-xs text-faint">
          {changed
            ? `${changedKeys.length} umbral(es) sin guardar.`
            : "Sin cambios pendientes."}
          {mutation.isSuccess && !changed && (
            <span className="ml-2 inline-flex items-center gap-1 text-success">
              <Check className="h-3.5 w-3.5" /> Guardado
            </span>
          )}
        </p>
        {saveBtn}
      </div>
    </div>
  );
}
