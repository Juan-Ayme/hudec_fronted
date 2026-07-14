import React from "react";
import { AlertTriangle, Clock, X, Check, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { money, num, pct } from "@/lib/format";
import type { ComprasCatalogoSku } from "@/lib/types";
import type { PurchaseDecision, PurchaseDecisionKind } from "@/lib/api";
import { ClassificationCell } from "@/components/ui/classification";
import { similaresLabel } from "../utils";

/** "11 jul, 14:30" — compacto para el badge de solicitud. */
function fmtSolicitado(iso: string): string {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SkuTable({
  rows,
  onSelect,
  onAction,
  solicitadasBySku,
  canDecidir,
}: {
  rows: ComprasCatalogoSku[];
  onSelect: (sku: ComprasCatalogoSku) => void;
  onAction: (sku: ComprasCatalogoSku, action: PurchaseDecisionKind) => void;
  /** SKU (display_code) → decisión 'solicitado' vigente, para pintar el badge. */
  solicitadasBySku: Map<string, PurchaseDecision>;
  /** operador/admin ven acciones de compra; viewer solo "Solicitar". */
  canDecidir: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate text-left text-xs" style={{ borderSpacing: 0 }}>
        <thead>
          <tr className="text-[10px] font-medium uppercase tracking-wider text-faint">
            <th className="py-2.5 pl-3 pr-2 font-medium border-b border-border-soft/40">Producto</th>
            <th className="py-2.5 px-2 font-medium border-b border-border-soft/40">Clasif.</th>
            <th className="py-2.5 px-2 text-right font-medium border-b border-border-soft/40">Stock</th>
            <th className="py-2.5 px-2 text-right font-medium border-b border-border-soft/40">Vendido 90d</th>
            <th className="py-2.5 px-2 text-right font-medium border-b border-border-soft/40">Sugerido</th>
            <th className="py-2.5 px-2 text-right font-medium border-b border-border-soft/40">Margen</th>
            <th className="py-2.5 pl-2 pr-3 text-center font-medium no-print border-b border-border-soft/40">Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <SkuTableRow
              key={`${s.sucursal}-${s.sku}`}
              s={s}
              onSelect={onSelect}
              onAction={onAction}
              solicitud={solicitadasBySku.get(s.sku) ?? null}
              canDecidir={canDecidir}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SkuTableRow = React.memo(function SkuTableRow({
  s,
  onSelect,
  onAction,
  solicitud,
  canDecidir,
}: {
  s: ComprasCatalogoSku;
  onSelect: (sku: ComprasCatalogoSku) => void;
  onAction: (sku: ComprasCatalogoSku, action: PurchaseDecisionKind) => void;
  solicitud: PurchaseDecision | null;
  canDecidir: boolean;
}) {
  return (
    <tr
      className="group transition-all duration-300"
    >
      <td
        className={cn(
          "cursor-pointer py-3 pl-3 pr-2 min-w-[220px] max-w-[340px] border-b border-border-soft/40 group-hover:border-border-soft/0 group-hover:bg-surface-3/30 transition-all duration-300 first:rounded-l-2xl",
          solicitud && "opacity-60 group-hover:opacity-100"
        )}
        onClick={() => onSelect(s)}
        title="Ver detalle"
      >
        <p className="truncate font-medium text-[13px] text-fg transition-colors group-hover:text-primary">
          {s.producto}
        </p>
        <p className="font-mono text-[10px] text-muted/70 mt-0.5">
          {s.sku}
          {s.subcategoria ? ` · ${s.subcategoria}` : ""}
        </p>
        {s.similares && s.similares.items.length > 0 && (
          <span
            title="Ya tienes productos parecidos con stock en esta subcategoría — revisar antes de comprar"
            className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-warning/90"
          >
            <AlertTriangle className="h-2.5 w-2.5" /> {similaresLabel(s.similares)}
          </span>
        )}
      </td>
      <td className={cn("py-2.5 px-2 border-b border-border-soft/40 group-hover:border-border-soft/0 group-hover:bg-surface-3/30 transition-all duration-300", solicitud && "opacity-60 group-hover:opacity-100")}>
        <ClassificationCell
          clasificacion={s.clasificacion}
          severidad={s.severidad}
          vel90d={s.velocidad_90d}
          vel30d={s.velocidad_30d}
          proy30d={s.proyeccion_30d}
        />
      </td>
      <td className={cn("py-2.5 px-2 text-right tabular-nums border-b border-border-soft/40 group-hover:border-border-soft/0 group-hover:bg-surface-3/30 transition-all duration-300", solicitud && "opacity-60 group-hover:opacity-100")}>
        <span
          className={cn(
            s.stock_disponible === 0 ? "font-bold text-danger" : "text-muted",
          )}
        >
          {num(s.stock_disponible)}
        </span>
        {s.stock_almacen > 0 && (
          <span className="ml-1 text-[10px] text-faint" title="Stock en almacén central">
            (+{num(s.stock_almacen)})
          </span>
        )}
      </td>
      <td className={cn("py-2.5 px-2 text-right tabular-nums text-muted border-b border-border-soft/40 group-hover:border-border-soft/0 group-hover:bg-surface-3/30 transition-all duration-300", solicitud && "opacity-60 group-hover:opacity-100")}>
        {num(s.unds_vend_90d)}
        {s.vendido_sku_soles > 0 && (
          <span className="block text-[10px] text-faint">
            {money(s.vendido_sku_soles)}
          </span>
        )}
      </td>
      <td className={cn("py-2.5 px-2 text-right tabular-nums font-semibold text-primary border-b border-border-soft/40 group-hover:border-border-soft/0 group-hover:bg-surface-3/30 transition-all duration-300", solicitud && "opacity-60 group-hover:opacity-100")}>
        {s.cantidad_sugerida > 0 ? num(s.cantidad_sugerida) : "—"}
      </td>
      <td className={cn("py-2.5 px-2 text-right tabular-nums border-b border-border-soft/40 group-hover:border-border-soft/0 group-hover:bg-surface-3/30 transition-all duration-300", solicitud && "opacity-60 group-hover:opacity-100")}>
        {s.margen_pct !== null ? (
          <span
            className={cn(
              "font-medium",
              s.margen_pct >= 30
                ? "text-success"
                : s.margen_pct >= 15
                  ? "text-warning"
                  : "text-danger",
            )}
            title={s.margen_origen === "catalogo" ? "Margen de catálogo (precio de lista − costo; sin ventas en 90d)" : undefined}
          >
            {s.margen_origen === "catalogo" ? "≈" : ""}{pct(s.margen_pct)}
          </span>
        ) : (
          <span className="text-faint">—</span>
        )}
      </td>
      <td className="py-3 pl-2 pr-3 text-center no-print border-b border-border-soft/40 group-hover:border-border-soft/0 group-hover:bg-surface-3/30 transition-all duration-300 last:rounded-r-2xl">
        {solicitud ? (
          // Ya solicitado: badge con fecha/hora (+ quién, si lo sabemos). Si el
          // usuario puede decidir, además ofrece resolver (Ordenar / Ignorar).
          <div className="inline-flex items-center gap-1.5">
            <span
              title={`Solicitado${solicitud.actor_username ? ` por ${solicitud.actor_username}` : ""} · ${fmtSolicitado(solicitud.created_at)}`}
              className="inline-flex items-center rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold text-warning"
            >
              <Check className="mr-1 h-3 w-3 shrink-0" />
              <span>Solicitado</span>
              <span className="flex items-center max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-in-out group-hover:max-w-[250px] group-hover:opacity-100 whitespace-nowrap">
                <span className="font-normal opacity-80 ml-1">· {fmtSolicitado(solicitud.created_at)}</span>
                {solicitud.actor_username && (
                  <span className="font-normal opacity-80 ml-1">· {solicitud.actor_username}</span>
                )}
              </span>
            </span>
            {canDecidir && (
              <>
                <button
                  onClick={() => onAction(s, "ordenar")}
                  className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary transition-all hover:bg-primary/20 active:scale-95"
                  title={`Ordenar ${s.cantidad_sugerida} uni.`}
                >
                  Ordenar
                </button>
                <button
                  onClick={() => onAction(s, "ignorar")}
                  className="rounded-full p-1.5 text-faint transition-all hover:bg-surface-2 hover:text-danger active:scale-95"
                  title="Ignorar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        ) : canDecidir ? (
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => onAction(s, "ordenar")}
              className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary transition-all hover:bg-primary/20 active:scale-95"
              title={`Ordenar ${s.cantidad_sugerida} uni.`}
            >
              Ordenar
            </button>
            <button
              onClick={() => onAction(s, "posponer")}
              className="rounded-full p-1.5 text-faint transition-all hover:bg-surface-2 hover:text-warning active:scale-95"
              title="Posponer"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onAction(s, "ignorar")}
              className="rounded-full p-1.5 text-faint transition-all hover:bg-surface-2 hover:text-danger active:scale-95"
              title="Ignorar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          // Rol viewer (encargado de tienda): solo puede avisar que falta.
          <button
            onClick={() => onAction(s, "solicitado")}
            className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1.5 text-[11px] font-medium text-warning transition-all hover:bg-warning/20 active:scale-95"
            title="Avisar que este producto hay que pedirlo"
          >
            <Send className="h-3.5 w-3.5" /> Solicitar
          </button>
        )}
      </td>
    </tr>
  );
});
