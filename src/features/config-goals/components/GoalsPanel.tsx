"use client";

import { useState, useMemo } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { useGoals } from "../hooks/useGoals";

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  if (!y || !m) return yyyymm;
  const d = new Date(y, m - 1, 1);
  const s = d.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function GoalsPanel() {
  const { q, mutation, month } = useGoals();
  const [globalInput, setGlobalInput] = useState("");
  const [offInputs, setOffInputs] = useState<Record<number, string>>({});
  const [syncedKey, setSyncedKey] = useState<string | null>(null);

  const dataKey = q.data
    ? `${month}:${q.data.global.meta}:${JSON.stringify(
        q.data.por_sucursal.map((r) => [r.office_id, r.meta]),
      )}`
    : null;

  if (q.data && dataKey !== syncedKey) {
    setSyncedKey(dataKey);
    setGlobalInput(q.data.global.meta != null ? String(q.data.global.meta) : "");
    const m: Record<number, string> = {};
    for (const r of q.data.por_sucursal) {
      if (r.office_id != null) m[r.office_id] = r.meta != null ? String(r.meta) : "";
    }
    setOffInputs(m);
  }

  const handleSave = () => {
    const offices: Record<string, number> = {};
    for (const [oid, v] of Object.entries(offInputs)) {
      const n = Number(v);
      if (v !== "" && Number.isFinite(n)) offices[oid] = n;
    }
    const g = Number(globalInput);
    mutation.mutate({
      meta_global: globalInput !== "" && Number.isFinite(g) ? g : null,
      offices,
    });
  };

  const changed = useMemo(() => {
    if (!q.data) return false;
    const initialGlobal = q.data.global.meta != null ? String(q.data.global.meta) : "";
    if (globalInput !== initialGlobal) return true;

    for (const r of q.data.por_sucursal) {
      if (r.office_id != null) {
        const initialVal = r.meta != null ? String(r.meta) : "";
        if (offInputs[r.office_id] !== initialVal) return true;
      }
    }
    return false;
  }, [q.data, globalInput, offInputs]);

  if (q.isError) return <ErrorState error={q.error} />;
  if (q.isLoading || !q.data) return <LoadingState label="Cargando metas..." />;

  const saveBtn = (
    <Button
      onClick={handleSave}
      disabled={!changed || mutation.isPending}
    >
      <Save className="h-4 w-4" />
      {mutation.isPending ? "Guardando…" : `Guardar cambios`}
    </Button>
  );

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <div className="flex-1">
          <p className="font-semibold text-fg">Metas mensuales por sucursal</p>
          <p className="mt-1 text-xs text-muted">
            Define la meta de ventas para el mes en curso ({monthLabel(month)}). La meta global se calculará automáticamente como la suma de las tiendas si la dejas vacía.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title={`Metas de ${monthLabel(month)}`} subtitle="Mes en curso" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {(q.data.por_sucursal ?? []).map(
              (r) =>
                r.office_id != null && (
                  <label key={r.office_id} className="flex flex-col gap-1.5">
                    <span className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
                      {r.sucursal} (office {r.office_id})
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={offInputs[r.office_id] ?? ""}
                      onChange={(e) =>
                        setOffInputs((p) => ({ ...p, [r.office_id as number]: e.target.value }))
                      }
                    />
                  </label>
                ),
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
                Meta global (opcional)
              </span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="auto (suma de tiendas)"
                value={globalInput}
                onChange={(e) => setGlobalInput(e.target.value)}
              />
            </label>
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-3 mt-6 flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-surface/95 px-4 py-3 backdrop-blur">
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
    </div>
  );
}
