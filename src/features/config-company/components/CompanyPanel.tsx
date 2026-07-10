"use client";

import { useState } from "react";
import { Check, Save, Wand2 } from "lucide-react";
import {
  type CompanyField,
  type CompanyResponse,
  type CompanyValues,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { useCompany } from "../hooks/useCompany";

export function CompanyPanel() {
  const { cfg, mutation, suggestMutation } = useCompany();

  const [values, setValues] = useState<CompanyValues | null>(null);
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const [recApplied, setRecApplied] = useState(false);
  const dataKey = cfg.data ? JSON.stringify(cfg.data.company) : null;
  if (cfg.data && dataKey !== syncedKey) {
    setSyncedKey(dataKey);
    setValues({ ...cfg.data.company });
    setRecApplied(false);
  }

  const handleSuggest = () => {
    suggestMutation.mutate(undefined, {
      onSuccess: (data) => {
        // Pre-cargo los valores sugeridos en el estado local. No guarda — el
        // usuario revisa, ajusta y aprieta "Guardar" cuando quiera.
        setValues((prev) =>
          prev
            ? {
                ...prev,
                brand_name: data.recommendations.brand_name || prev.brand_name,
                classification_label:
                  data.recommendations.classification_label ||
                  prev.classification_label,
                offices_tienda: data.recommendations.offices_tienda,
                office_almacen: data.recommendations.office_almacen,
                tipos_venta: data.recommendations.tipos_venta,
                tipos_devolucion: data.recommendations.tipos_devolucion,
                tipos_traslado: data.recommendations.tipos_traslado,
                bsale_warehouse_user_ids:
                  data.recommendations.bsale_warehouse_user_ids,
                target_categories: data.recommendations.target_categories,
              }
            : prev,
        );
        setRecApplied(true);
      },
    });
  };

  if (cfg.isError) return <ErrorState error={cfg.error} />;
  if (cfg.isLoading || !cfg.data || !values)
    return <LoadingState label="Cargando configuración de empresa…" />;

  const original = cfg.data.company;
  const sections = cfg.data.sections;
  const catalogs = cfg.data.catalogs;

  const changedKeys = (Object.keys(values) as (keyof CompanyValues)[]).filter(
    (k) => JSON.stringify(values[k]) !== JSON.stringify(original[k]),
  );
  const changed = changedKeys.length > 0;

  const updateField = <K extends keyof CompanyValues>(k: K, v: CompanyValues[K]) =>
    setValues((prev) => (prev ? { ...prev, [k]: v } : prev));

  const saveBtn = (
    <Button
      onClick={() =>
        mutation.mutate(
          Object.fromEntries(
            changedKeys.map((k) => [k, values[k]]),
          ) as Partial<CompanyValues>,
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
      <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <div className="flex-1">
          <p className="font-semibold text-fg">
            💡 ¿Empresa nueva? El sistema puede analizar tus datos y sugerir
            todos los IDs por vos.
          </p>
          <p className="mt-1 text-xs text-muted">
            Detecta tipos de venta/devolución/traslado, sucursales que venden
            vs almacén central, almaceneros (por nº de recepciones) y top
            categorías. Te muestra la propuesta — vos revisás y guardás.
          </p>
          {recApplied && !suggestMutation.isPending && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-success">
              <Check className="h-3.5 w-3.5" /> Sugerencias aplicadas al
              formulario (sin guardar). Revisá y apretá Guardar.
            </p>
          )}
          {suggestMutation.isError && (
            <p className="mt-2 text-xs text-danger">
              Error al obtener sugerencias:{" "}
              {String((suggestMutation.error as Error)?.message ?? "")}
            </p>
          )}
        </div>
        <Button
          onClick={handleSuggest}
          disabled={suggestMutation.isPending}
        >
          <Wand2 className="h-4 w-4" />
          {suggestMutation.isPending ? "Analizando…" : "Sugerir configuración"}
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((sec) => (
          <Card key={sec.key}>
            <CardHeader title={sec.title} subtitle={sec.description} />
            <CardBody>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {sec.fields.map((f) => (
                  <CompanyFieldControl
                    key={f.key}
                    field={f}
                    value={values[f.key as keyof CompanyValues]}
                    onChange={(v) =>
                      updateField(f.key as keyof CompanyValues, v as never)
                    }
                    catalogs={catalogs}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-3 mt-6 flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-surface/95 px-4 py-3 backdrop-blur">
        <p className="text-xs text-faint">
          {changed
            ? `${changedKeys.length} campo(s) sin guardar: ${changedKeys.join(", ")}`
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

function CompanyFieldControl({
  field,
  value,
  onChange,
  catalogs,
}: {
  field: CompanyField;
  value: CompanyValues[keyof CompanyValues];
  onChange: (v: CompanyValues[keyof CompanyValues]) => void;
  catalogs: CompanyResponse["catalogs"];
}) {
  const wrap = (control: React.ReactNode, count?: string) => (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between text-caption font-semibold uppercase tracking-[0.08em] text-muted">
        <span>{field.label}</span>
        {count && (
          <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[0.62rem] normal-case tracking-normal text-muted">
            {count}
          </span>
        )}
      </span>
      {control}
      <span className="text-caption text-faint">{field.help}</span>
    </div>
  );

  switch (field.kind) {
    case "text":
      return wrap(
        <Input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />,
      );

    case "single_office": {
      const v = typeof value === "number" ? value : null;
      return wrap(
        <select
          value={v ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          className="h-9 rounded-md border border-border-soft bg-surface-2 px-3 text-body text-fg focus:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">— (sin almacén central) —</option>
          {catalogs.offices.map((o) => (
            <option key={o.id} value={o.id}>
              #{o.id} — {o.name}
              {!o.is_active ? " (inactiva)" : ""}
            </option>
          ))}
        </select>,
      );
    }

    case "multi_office":
      return wrap(
        <MultiSelectChips
          options={catalogs.offices.map((o) => ({
            id: o.id,
            label: o.name,
            sub: `#${o.id}${!o.is_active ? " · inactiva" : ""}`,
          }))}
          selected={Array.isArray(value) ? (value as number[]) : []}
          onChange={(ids) => onChange(ids as never)}
        />,
        `${(value as number[]).length} seleccionada(s)`,
      );

    case "multi_document_type":
      return wrap(
        <MultiSelectChips
          options={catalogs.document_types.map((d) => ({
            id: d.id,
            label: d.name,
            sub: `#${d.id}${d.code ? ` · ${d.code}` : ""}${
              d.is_credit_note ? " · NC" : ""
            }`,
          }))}
          selected={Array.isArray(value) ? (value as number[]) : []}
          onChange={(ids) => onChange(ids as never)}
        />,
        `${(value as number[]).length} seleccionado(s)`,
      );

    case "multi_user":
      return wrap(
        <MultiSelectChips
          options={catalogs.users.map((u) => ({
            id: u.id,
            label: u.name || `Usuario #${u.id}`,
            sub: `#${u.id}${u.email ? ` · ${u.email}` : ""}${
              !u.is_active ? " · inactivo" : ""
            }`,
          }))}
          selected={Array.isArray(value) ? (value as number[]) : []}
          onChange={(ids) => onChange(ids as never)}
        />,
        `${(value as number[]).length} seleccionado(s)`,
      );

    case "multi_category":
      return wrap(
        <MultiSelectChips
          options={catalogs.categories.map((c) => ({
            id: c.id,
            label: c.name,
            sub: c.department_name,
          }))}
          selected={Array.isArray(value) ? (value as number[]) : []}
          onChange={(ids) => onChange(ids as never)}
        />,
        `${(value as number[]).length} seleccionada(s)`,
      );
  }
}

function MultiSelectChips({
  options,
  selected,
  onChange,
}: {
  options: { id: number; label: string; sub?: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [query, setQuery] = useState("");
  const sel = new Set(selected);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.sub ?? "").toLowerCase().includes(q) ||
          String(o.id).includes(q),
      )
    : options;

  const toggle = (id: number) => {
    const n = new Set(sel);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onChange([...n].sort((a, b) => a - b));
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border-soft bg-surface-2 p-2">
      <Input
        type="text"
        placeholder="Buscar por nombre o ID…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-48 overflow-y-auto rounded border border-border/30 bg-surface/40">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-center text-caption text-faint">
            Sin coincidencias.
          </p>
        ) : (
          filtered.map((o) => {
            const on = sel.has(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => toggle(o.id)}
                aria-pressed={on}
                className={cn(
                  "flex w-full items-center justify-between gap-2 border-b border-border/20 px-2.5 py-1.5 text-left text-sm transition-colors last:border-b-0",
                  on
                    ? "bg-primary/10 text-fg"
                    : "text-muted hover:bg-surface-3 hover:text-fg",
                )}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{o.label}</span>
                  {o.sub && (
                    <span className="text-[0.65rem] text-faint">{o.sub}</span>
                  )}
                </span>
                {on && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
