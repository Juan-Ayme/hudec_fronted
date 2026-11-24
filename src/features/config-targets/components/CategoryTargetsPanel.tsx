"use client";

import { useMemo, useState } from "react";
import {
  Filter,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { money, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryTarget, CategoryTargetPatch, TargetRol } from "@/lib/bi-types";
import { ROL_TARGET } from "@/features/bi/shared";
import { useCategoryTargets } from "../hooks/useCategoryTargets";

/**
 * Panel admin para /configuracion?tab=targets. Lista los category_targets
 * cargados, permite editar campos inline vía dialog y eliminar filas.
 */
export function CategoryTargetsPanel() {
  const [officeFilter, setOfficeFilter] = useState<string>("todos");
  const [rolFilter, setRolFilter] = useState<string>("todos");
  const [editing, setEditing] = useState<CategoryTarget | null>(null);
  const [borrando, setBorrando] = useState<CategoryTarget | null>(null);   // confirmar antes de eliminar

  const parsedOffice = officeFilter === "todos" ? null : Number(officeFilter);
  const { list, update, remove } = useCategoryTargets(parsedOffice);

  const offices = useMemo(() => {
    if (!list.data) return [];
    const seen = new Map<number, string>();
    for (const t of list.data.items) seen.set(t.bsale_office_id, t.sucursal);
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [list.data]);

  const filtered = useMemo(() => {
    if (!list.data) return [];
    return list.data.items.filter((t) => {
      if (rolFilter !== "todos" && t.rol !== rolFilter) return false;
      return true;
    });
  }, [list.data, rolFilter]);

  if (list.isError) return <ErrorState error={list.error} />;
  if (list.isLoading || !list.data)
    return <LoadingState label="Cargando category targets…" />;

  const isEmpty = list.data.items.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          eyebrow="Admin · Category targets"
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet" />
              {list.data.total} categorías cargadas
            </span>
          }
          subtitle="Metas mensuales, roles (motor / fijo / complemento / upsell) y umbrales de SKUs por categoría-sucursal. Alimenta el bloque 80/20 de /salud-catalogo y el desglose de presupuesto de /plan-mes."
        />

        {isEmpty ? (
          <CardBody>
            <EmptyState
              title="No hay category targets cargados"
              hint="Aún no se han registrado metas por categoría para esta selección."
            />
          </CardBody>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-border-soft bg-surface-2/40 px-5 py-3">
              <div className="flex items-center gap-1 text-caption">
                <Filter className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
                <span className="font-semibold text-faint">Filtros:</span>
              </div>
              <SelectChip
                label="Sucursal"
                value={officeFilter}
                onChange={setOfficeFilter}
                options={[
                  { value: "todos", label: "Todas" },
                  ...offices.map((o) => ({
                    value: String(o.id),
                    label: o.name,
                  })),
                ]}
              />
              <SelectChip
                label="Rol"
                value={rolFilter}
                onChange={setRolFilter}
                options={[
                  { value: "todos", label: "Todos" },
                  ...Object.entries(ROL_TARGET).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  })),
                ]}
              />
              <span className="ml-auto text-caption text-faint">
                {filtered.length} de {list.data.items.length} filas
              </span>
            </div>

            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-caption">
                <thead className="sticky top-0 bg-surface-2/95 backdrop-blur-md">
                  <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
                    <th className="px-4 py-2 text-left font-semibold">Categoría</th>
                    <th className="px-4 py-2 text-left font-semibold">Sucursal</th>
                    <th className="px-4 py-2 text-left font-semibold">Rol</th>
                    <th className="px-4 py-2 text-right font-semibold">Meta</th>
                    <th className="px-4 py-2 text-right font-semibold">PVP</th>
                    <th className="px-4 py-2 text-right font-semibold">Margen</th>
                    <th className="px-4 py-2 text-right font-semibold">SKUs</th>
                    <th className="px-4 py-2 text-right font-semibold w-1">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const rol = ROL_TARGET[t.rol];
                    return (
                      <tr
                        key={`${t.category_id}-${t.bsale_office_id}`}
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
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-fg font-semibold">
                          {money(t.meta_mensual_pen)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                          {money(t.pvp_min)}–{money(t.pvp_max)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-fg">
                          {pct(t.margen_objetivo_pct)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                          {num(t.skus_min)}–{num(t.skus_max)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <button
                            onClick={() => setEditing(t)}
                            className="rounded p-1 text-muted hover:bg-surface-3 hover:text-info"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setBorrando(t)}
                            className="rounded p-1 text-muted hover:bg-surface-3 hover:text-danger"
                            title="Eliminar"
                            disabled={remove.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Dialog
        open={!!borrando}
        onClose={() => !remove.isPending && setBorrando(null)}
        title="¿Eliminar esta meta?"
        description={borrando ? `${borrando.categoria} · ${borrando.sucursal}. Se borran su meta mensual, su rol y sus umbrales.` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBorrando(null)} disabled={remove.isPending}>Cancelar</Button>
            <Button variant="danger" loading={remove.isPending}
              onClick={() => borrando && remove.mutate(
                { category_id: borrando.category_id, office_id: borrando.bsale_office_id },
                { onSettled: () => setBorrando(null) },
              )}>
              Sí, eliminar
            </Button>
          </>
        }
      />

      {editing && (
        <EditTargetDialog
          target={editing}
          onCancel={() => setEditing(null)}
          onSave={(patch) =>
            update.mutate(
              {
                category_id: editing.category_id,
                office_id: editing.bsale_office_id,
                patch,
              },
              { onSuccess: () => setEditing(null) },
            )
          }
          saving={update.isPending}
        />
      )}
    </div>
  );
}

function SelectChip({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-1 rounded-md border border-border-soft bg-surface px-2 py-1 text-caption">
      <span className="font-semibold text-faint">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-semibold text-fg focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditTargetDialog({
  target,
  onCancel,
  onSave,
  saving,
}: {
  target: CategoryTarget;
  onCancel: () => void;
  onSave: (patch: CategoryTargetPatch) => void;
  saving: boolean;
}) {
  const [rol, setRol] = useState<TargetRol>(target.rol);
  const [meta, setMeta] = useState(String(target.meta_mensual_pen));
  const [pvpMin, setPvpMin] = useState(String(target.pvp_min));
  const [pvpMax, setPvpMax] = useState(String(target.pvp_max));
  const [margen, setMargen] = useState(String(target.margen_objetivo_pct));
  const [skusMin, setSkusMin] = useState(String(target.skus_min));
  const [skusMax, setSkusMax] = useState(String(target.skus_max));

  const handleSubmit = () => {
    const patch: CategoryTargetPatch = {};
    if (rol !== target.rol) patch.rol = rol;
    const metaN = Number(meta);
    if (Number.isFinite(metaN) && metaN !== target.meta_mensual_pen)
      patch.meta_mensual_pen = metaN;
    const pvpMinN = Number(pvpMin);
    if (Number.isFinite(pvpMinN) && pvpMinN !== target.pvp_min)
      patch.pvp_min = pvpMinN;
    const pvpMaxN = Number(pvpMax);
    if (Number.isFinite(pvpMaxN) && pvpMaxN !== target.pvp_max)
      patch.pvp_max = pvpMaxN;
    const margenN = Number(margen);
    if (Number.isFinite(margenN) && margenN !== target.margen_objetivo_pct)
      patch.margen_objetivo_pct = margenN;
    const skusMinN = Number(skusMin);
    if (Number.isFinite(skusMinN) && skusMinN !== target.skus_min)
      patch.skus_min = skusMinN;
    const skusMaxN = Number(skusMax);
    if (Number.isFinite(skusMaxN) && skusMaxN !== target.skus_max)
      patch.skus_max = skusMaxN;

    if (Object.keys(patch).length === 0) {
      onCancel();
      return;
    }
    onSave(patch);
  };

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <Card
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-body font-bold text-fg">
              {target.categoria}
            </h3>
            <p className="truncate text-caption text-muted">
              {target.departamento} · {target.sucursal}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CardBody className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[0.65rem] font-bold uppercase tracking-wider text-faint">
              Rol
            </label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as TargetRol)}
              className="mt-1 w-full rounded-md border border-border-soft bg-surface-2 px-2 py-1.5 text-caption text-fg focus:border-primary focus:outline-none"
            >
              {Object.entries(ROL_TARGET).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <NumField label="Meta mensual (S/)" value={meta} onChange={setMeta} />
          <NumField
            label="Margen objetivo (%)"
            value={margen}
            onChange={setMargen}
            step="0.1"
          />
          <NumField label="PVP mínimo (S/)" value={pvpMin} onChange={setPvpMin} step="0.1" />
          <NumField label="PVP máximo (S/)" value={pvpMax} onChange={setPvpMax} step="0.1" />
          <NumField label="SKUs mínimo" value={skusMin} onChange={setSkusMin} />
          <NumField label="SKUs máximo" value={skusMax} onChange={setSkusMax} />
        </CardBody>
        <div className="flex items-center justify-end gap-2 border-t border-border-soft bg-surface-2/60 px-5 py-3">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            <Save className="h-4 w-4" aria-hidden="true" /> Guardar cambios
          </Button>
        </div>
      </Card>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[0.65rem] font-bold uppercase tracking-wider text-faint">
        {label}
      </label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 font-mono text-caption tabular-nums",
        )}
      />
    </div>
  );
}
