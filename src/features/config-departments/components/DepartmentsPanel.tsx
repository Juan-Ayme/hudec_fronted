"use client";

import { useState } from "react";
import { Ban, Check, Save, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { useDepartments } from "../hooks/useDepartments";

function setEq(a: Set<number>, b: Set<number>) {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

export function DepartmentsPanel() {
  const { cfg, mutation } = useDepartments();

  // Estado local: dos sets editables (excluidos / estacionales).
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [seasonal, setSeasonal] = useState<Set<number>>(new Set());
  // Sincroniza con el server durante el render (no useEffect). Re-sincroniza al guardar.
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const dataKey = cfg.data
    ? JSON.stringify([
        [...cfg.data.excluded_departments].sort((a, b) => a - b),
        [...cfg.data.seasonal_departments].sort((a, b) => a - b),
      ])
    : null;
  if (cfg.data && dataKey !== syncedKey) {
    setSyncedKey(dataKey);
    setExcluded(new Set(cfg.data.excluded_departments));
    setSeasonal(new Set(cfg.data.seasonal_departments));
  }

  const depts = cfg.data?.departments ?? [];
  const initExcl = new Set(cfg.data?.excluded_departments ?? []);
  const initSeas = new Set(cfg.data?.seasonal_departments ?? []);
  const changed =
    depts.length > 0 && (!setEq(excluded, initExcl) || !setEq(seasonal, initSeas));

  const flip = (
    setter: React.Dispatch<React.SetStateAction<Set<number>>>,
    id: number,
  ) =>
    setter((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const saveBtn = (
    <Button
      onClick={() =>
        mutation.mutate({
          excluded_departments: [...excluded],
          seasonal_departments: [...seasonal],
        })
      }
      disabled={!changed || mutation.isPending}
    >
      <Save className="h-4 w-4" />
      {mutation.isPending ? "Guardando…" : "Guardar cambios"}
    </Button>
  );

  if (cfg.isError) return <ErrorState error={cfg.error} />;
  if (cfg.isLoading) return <LoadingState label="Cargando configuración…" />;

  return (
    <Card>
      <CardHeader
        title="Departamentos"
        subtitle={`${excluded.size} excluido(s) · ${seasonal.size} estacional(es)`}
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setExcluded(new Set())}
              disabled={excluded.size === 0}
              title="Incluir todos los departamentos en los cálculos"
            >
              <Ban className="h-4 w-4" /> Quitar exclusiones
            </Button>
            <Button
              onClick={() => setSeasonal(new Set())}
              disabled={seasonal.size === 0}
              title="Quitar la marca estacional de todos"
            >
              <Ban className="h-4 w-4" /> Quitar estacionales
            </Button>
          </div>
        }
      />
      <CardBody>
        <div className="mb-3 flex flex-wrap items-center gap-4 text-[0.7rem] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-danger/20 text-danger">
              <EyeOff className="h-3 w-3" />
            </span>
            Excluir = se oculta por completo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-violet/20 text-violet">
              <Sparkles className="h-3 w-3" />
            </span>
            Estacional = lógica de campaña
          </span>
          <span className="text-faint">
            (si un depto está excluido + estacional, la exclusión gana → estacional inerte)
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/50">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-surface-2 text-[10px] font-bold uppercase tracking-wider text-faint">
                <th className="py-2 pl-3 text-left">Departamento</th>
                <th className="py-2 px-2 text-center w-28">Excluir</th>
                <th className="py-2 px-2 text-center w-28">Estacional</th>
              </tr>
            </thead>
            <tbody>
              {depts.map((d) => {
                const isExcl = excluded.has(d.id);
                const isSeas = seasonal.has(d.id);
                return (
                  <tr
                    key={d.id}
                    className="border-b border-border/20 hover:bg-surface-2/40"
                  >
                    <td className="py-2 pl-3 text-fg">
                      {d.name}
                      {isExcl && isSeas && (
                        <span className="ml-2 text-[0.62rem] text-faint">
                          (estacional inerte: está excluido)
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <ToggleChip
                        on={isExcl}
                        onClick={() => flip(setExcluded, d.id)}
                        tone="danger"
                        label="Excluir"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <ToggleChip
                        on={isSeas}
                        onClick={() => flip(setSeasonal, d.id)}
                        tone="violet"
                        label="Estacional"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/30 pt-3">
          <p className="text-xs text-faint">
            {changed ? "Tienes cambios sin guardar." : "Sin cambios pendientes."}
            {mutation.isSuccess && !changed && (
              <span className="ml-2 inline-flex items-center gap-1 text-success">
                <Check className="h-3.5 w-3.5" /> Guardado
              </span>
            )}
          </p>
          {saveBtn}
        </div>
      </CardBody>
    </Card>
  );
}

function ToggleChip({
  on,
  onClick,
  tone,
  label,
}: {
  on: boolean;
  onClick: () => void;
  tone: "danger" | "violet";
  label: string;
}) {
  const onStyles =
    tone === "danger"
      ? "border-danger/40 bg-danger/15 text-danger"
      : "border-violet/40 bg-violet/15 text-violet";
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "rounded-full border px-3 py-1 text-[0.7rem] font-semibold transition-colors",
        on
          ? onStyles
          : "border-border text-faint hover:bg-surface-3 hover:text-muted",
      )}
    >
      {on ? `✓ ${label}` : label}
    </button>
  );
}
