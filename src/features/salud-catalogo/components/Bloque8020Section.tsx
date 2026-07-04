"use client";

import { useState } from "react";
import { Building2, Sparkles, Store } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  Bloque8020,
  Bloque8020Categoria,
  Bloque8020Sucursal,
} from "@/lib/bi-types";
import {
  EstadoBadge,
  HelpTip,
  ROL_TARGET,
  SKUS_ESTADO,
  formatAvance,
  formatMes,
} from "@/features/bi/shared";

/**
 * Sección 80/20 con:
 *   - Cards por sucursal (avance, ritmo, conteo por estado).
 *   - Tabla filtrable de categorías con rol, meta, avance y estado.
 */
export function Bloque8020Section({ bloque }: { bloque: Bloque8020 }) {
  return (
    <Card>
      <CardHeader
        eyebrow={`Categorías clave (regla 80/20) · ${formatMes(bloque.mes)}`}
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet" />
            {bloque.total_categorias} categorías con meta cargada
            <HelpTip text="El puñado de categorías que concentra la mayor parte de la venta (regla 80/20). Cada una tiene meta mensual, un rol en el negocio y un rango ideal de surtido." />
          </span>
        }
        subtitle={`Día ${bloque.dias_transcurridos} de ${bloque.dias_del_mes} · datos al cierre de ${bloque.ultimo_dia_cerrado}`}
      />
      <CardBody className="flex flex-col gap-5">
        {bloque.por_sucursal.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {bloque.por_sucursal.map((s) => (
              <SucursalCard key={s.office_id} sucursal={s} />
            ))}
          </div>
        )}

        <CategoriasTable categorias={bloque.categorias} />
      </CardBody>
    </Card>
  );
}

function SucursalCard({ sucursal }: { sucursal: Bloque8020Sucursal }) {
  // El COLOR sale del ritmo (venta vs lo esperado al día de hoy), no del
  // avance del mes: a inicio de mes el avance siempre es bajo y pintarlo
  // rojo confunde. El ritmo sí dice si la sucursal va bien o mal HOY.
  const ritmo = formatAvance(sucursal.ritmo_vs_meta_pct);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-soft bg-surface-2/40 p-3">
      <div className="flex items-center gap-2">
        <Store className="h-4 w-4 text-primary" aria-hidden="true" />
        <p className="truncate text-body font-semibold text-fg">
          {sucursal.sucursal}
        </p>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-caption text-muted">Venta / Meta</p>
          <p className="font-mono text-body font-bold tabular-nums text-fg">
            {money(sucursal.venta_acumulada_total)}
          </p>
          <p className="font-mono text-[0.65rem] tabular-nums text-faint">
            de {money(sucursal.meta_total)}
          </p>
        </div>
        <div className="text-right">
          <p
            className="cursor-help text-caption text-muted underline decoration-dotted decoration-muted/40 underline-offset-2"
            title="Venta acumulada vs lo esperado al día de hoy. 100% = al día con la meta; menos de 80% = en riesgo."
          >
            Ritmo
          </p>
          <p
            className={cn(
              "font-mono text-lg font-bold tabular-nums",
              ritmo.tone === "success"
                ? "text-success"
                : ritmo.tone === "warning"
                ? "text-warning"
                : ritmo.tone === "danger"
                ? "text-danger"
                : "text-fg",
            )}
          >
            {ritmo.text}
          </p>
          <p className="font-mono text-[0.65rem] tabular-nums text-faint">
            Avance del mes {pct(sucursal.avance_pct)}
          </p>
        </div>
      </div>

      <div
        className="grid grid-cols-4 gap-1.5 border-t border-border-soft pt-2 text-center"
        title="Cuántas de las categorías con meta de esta sucursal están en cada situación"
      >
        <StatePill n={sucursal.cumplen} label="Cumplen" tone="success" />
        <StatePill n={sucursal.en_ritmo} label="En ritmo" tone="success" />
        <StatePill n={sucursal.atrasado_leve} label="Atraso" tone="warning" />
        <StatePill n={sucursal.riesgo} label="Riesgo" tone="danger" />
      </div>
    </div>
  );
}

function StatePill({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: "success" | "warning" | "danger";
}) {
  const cls = {
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    danger: "bg-danger/12 text-danger",
  }[tone];
  return (
    <div className={cn("rounded-md px-1.5 py-1", cls)}>
      <p className="font-mono text-body font-bold tabular-nums">{n}</p>
      <p className="text-[0.55rem] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}

type SortKey = "avance" | "gap" | "meta" | "venta" | "categoria";

function CategoriasTable({
  categorias,
}: {
  categorias: Bloque8020Categoria[];
}) {
  const [sortBy, setSortBy] = useState<SortKey>("gap");
  const [filterRol, setFilterRol] = useState<string>("todos");
  const [filterOffice, setFilterOffice] = useState<string>("todos");

  const offices = Array.from(
    new Set(categorias.map((c) => `${c.office_id}::${c.sucursal}`)),
  ).map((s) => {
    const [id, name] = s.split("::");
    return { id: Number(id), name };
  });

  const filtered = categorias.filter((c) => {
    if (filterRol !== "todos" && c.rol !== filterRol) return false;
    if (filterOffice !== "todos" && String(c.office_id) !== filterOffice)
      return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "avance":
        return a.avance_pct - b.avance_pct;
      case "gap":
        return a.gap_a_meta - b.gap_a_meta;
      case "meta":
        return b.meta_mensual_pen - a.meta_mensual_pen;
      case "venta":
        return b.venta_acumulada_mes - a.venta_acumulada_mes;
      case "categoria":
        return a.categoria.localeCompare(b.categoria);
    }
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-caption">
          <Building2 className="h-4 w-4 text-info" aria-hidden="true" />
          <span className="font-semibold text-fg">Categorías</span>
          <span className="text-faint">({sorted.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <SelectChip
            label="Sucursal"
            value={filterOffice}
            onChange={setFilterOffice}
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
            value={filterRol}
            onChange={setFilterRol}
            options={[
              { value: "todos", label: "Todos" },
              ...Object.entries(ROL_TARGET).map(([k, v]) => ({
                value: k,
                label: v.label,
              })),
            ]}
          />
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto custom-scrollbar rounded-lg border border-border-soft">
        <table className="w-full text-caption">
          <thead className="sticky top-0 bg-surface-2/95 backdrop-blur-md">
            <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
              <SortHeader label="Categoría" sortKey="categoria" current={sortBy} onSort={setSortBy} align="left" />
              <th className="px-3 py-2 text-left font-semibold">Rol · Sucursal</th>
              <SortHeader label="Meta" sortKey="meta" current={sortBy} onSort={setSortBy} align="right" />
              <SortHeader label="Venta" sortKey="venta" current={sortBy} onSort={setSortBy} align="right" />
              <SortHeader label="Avance" sortKey="avance" current={sortBy} onSort={setSortBy} align="right" />
              <SortHeader
                label="Diferencia"
                title="Venta acumulada menos meta del mes: negativo (rojo) = lo que falta, positivo (verde) = lo que sobra"
                sortKey="gap"
                current={sortBy}
                onSort={setSortBy}
                align="right"
              />
              <th className="px-3 py-2 text-left font-semibold">Estado</th>
              <th
                className="cursor-help px-3 py-2 text-left font-semibold"
                title="Variedad de productos: con stock hoy / rango ideal (mínimo–máximo) definido para la categoría"
              >
                Surtido
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <CategoriaRow key={`${c.category_id}-${c.office_id}`} c={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  title,
  sortKey,
  current,
  onSort,
  align,
}: {
  label: string;
  title?: string;
  sortKey: SortKey;
  current: SortKey;
  onSort: (k: SortKey) => void;
  align: "left" | "right";
}) {
  const isActive = current === sortKey;
  return (
    <th
      className={cn(
        "px-3 py-2 font-semibold cursor-pointer transition-colors",
        isActive ? "text-primary" : "hover:text-fg",
        align === "right" ? "text-right" : "text-left",
      )}
      title={title ?? `Ordenar por ${label.toLowerCase()}`}
      onClick={() => onSort(sortKey)}
    >
      {label} {isActive && "↓"}
    </th>
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
    <label className="inline-flex items-center gap-1 rounded-md border border-border-soft bg-surface-2 px-2 py-1 text-caption">
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

function CategoriaRow({ c }: { c: Bloque8020Categoria }) {
  const rol = ROL_TARGET[c.rol];
  const skus = SKUS_ESTADO[c.skus_estado] ?? { tone: "neutral", label: c.skus_estado };
  return (
    <tr className="border-b border-border-soft/50 hover:bg-surface-2/40">
      <td className="px-3 py-2">
        <p className="truncate font-semibold text-fg">{c.categoria}</p>
        <p className="truncate text-[0.6rem] text-faint">{c.departamento}</p>
      </td>
      <td className="px-3 py-2">
        <Badge tone={rol.tone} className="mr-1">
          {rol.label}
        </Badge>
        <span className="text-[0.65rem] text-muted">{c.sucursal}</span>
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-fg">
        {money(c.meta_mensual_pen)}
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-fg">
        {money(c.venta_acumulada_mes)}
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-fg">
        {pct(c.avance_pct)}
      </td>
      <td
        className={cn(
          "px-3 py-2 text-right font-mono tabular-nums",
          c.gap_a_meta > 0
            ? "text-success"
            : c.gap_a_meta < 0
            ? "text-danger"
            : "text-fg",
        )}
      >
        {c.gap_a_meta > 0 ? "+" : c.gap_a_meta < 0 ? "−" : ""}
        {money(Math.abs(c.gap_a_meta))}
      </td>
      <td className="px-3 py-2">
        <EstadoBadge estado={c.estado} />
      </td>
      <td className="px-3 py-2">
        <Badge
          tone={skus.tone}
          className="cursor-help whitespace-nowrap"
          title={`${skus.label}: hay ${c.skus_con_stock} productos con stock y el rango ideal para esta categoría es ${c.skus_min}–${c.skus_max}.`}
        >
          {c.skus_con_stock} / {c.skus_min}–{c.skus_max}
        </Badge>
      </td>
    </tr>
  );
}
