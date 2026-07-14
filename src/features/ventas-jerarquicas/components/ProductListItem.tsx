import React from "react";
import { ChevronRight, Banknote, Package, Box, Target, TrendingUp, Activity, AlertTriangle, ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { moneyCompact, num, num2, pct } from "@/lib/format";
import { getClassificationMeta, SmoothSparkline, shortClasif } from "@/components/ui/classification";
import { getClasif } from "@/lib/matrix-classify";
import { Row } from "../types";
import { s, n } from "../utils";
import { SimilarsInfo, similarsLabel } from "../utils/similarity";

function getTrendMock(tendencia: string, clasif: string) {
  const t = tendencia.toUpperCase();
  const c = clasif.toUpperCase();
  if (t.includes("CRECIENDO RÁPIDO") || c.includes("BESTSELLER RÁPIDO")) return [1, 2, 3.5];
  if (t.includes("CRECIENDO") || c.includes("EMERGENTE")) return [1, 1.5, 2];
  if (t.includes("BAJANDO RÁPIDO") || c.includes("EX-BESTSELLER")) return [3, 1.5, 0.5];
  if (t.includes("BAJANDO")) return [2, 1.5, 1];
  if (t.includes("INICIO") || c.includes("NUEVO")) return [0, 1, 2.5];
  if (c.includes("MUERTO") || c.includes("EXTINTA")) return [0.5, 0.1, 0];
  if (c.includes("LENTO") || c.includes("PARADO")) return [1, 0.8, 0.5];
  if (c.includes("BESTSELLER")) return [3, 3, 3.2];
  return [1, 1, 1];
}

export const ProductListItem = React.memo(function ProductListItem({
  sku,
  ventas,
  unidades,
  stock,
  similares,
  onClick,
  isSolicitado,
  onJumpToCompras,
}: {
  sku: Row;
  ventas: number;
  unidades: number;
  stock: number;
  similares?: SimilarsInfo;
  onClick?: () => void;
  isSolicitado?: boolean;
  /** Salto cruzado (Centro de Catálogo): abre este SKU en Decisiones de Compra. */
  onJumpToCompras?: () => void;
}) {
  const clasif = getClasif(sku as Record<string, unknown>);
  const tendencia = String(sku["Tendencia"] || "");
  const meta = getClassificationMeta(clasif);
  const Icon = meta.icon;
  
  const [v90, v30, p30] = getTrendMock(tendencia, clasif);
  const hasSimilares = !!similares && similares.items.length > 0;

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-3 hover:bg-surface-3/40 hover:shadow-lg transition-all duration-300 ease-out cursor-pointer group rounded-xl mx-2 my-1 border border-transparent hover:border-white/5 relative overflow-hidden",
      hasSimilares && "border-l-2 border-l-warning/60 rounded-l-none",
      isSolicitado && "opacity-60 grayscale-[50%] hover:opacity-100 hover:grayscale-0"
    )} onClick={onClick}>
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* 1. Identificador */}
      <div className="flex w-full sm:w-1/3 min-w-[200px] flex-col justify-center relative z-10">
        <p className="line-clamp-1 text-sm font-semibold text-fg group-hover:text-primary transition-colors duration-300" title={s(sku["Producto"])}>
          {s(sku["Producto"]) || "—"}
        </p>
        <p className="font-mono text-[0.65rem] text-faint mt-1">
          {s(sku["Código SKU"])} <span className="mx-1 text-border">|</span> <span className="text-muted">{s(sku["Categoría"])}</span>
        </p>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className={cn("inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/5 shadow-sm", meta.bgClass, meta.colorClass)}>
            <Icon className="h-2.5 w-2.5" /> {shortClasif(clasif)}
          </span>
          {hasSimilares && (
            <span
              title="Ya tienes productos parecidos en otras categorías de la misma subcategoría"
              className="inline-flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border border-warning/30 bg-warning/15 text-warning shadow-sm"
            >
              <AlertTriangle className="h-2.5 w-2.5" /> {similarsLabel(similares!)}
            </span>
          )}
        </div>
      </div>

      {/* 2. Visualización: Sparkline */}
      <div className="flex flex-1 items-center gap-4 relative z-10">
        <div className="w-24 shrink-0 hidden md:block opacity-70 group-hover:opacity-100 transition-opacity duration-300" title={`Tendencia: ${tendencia || 'Estable'}`}>
          <SmoothSparkline v90={v90} v30={v30} p30={p30} width={90} height={24} />
        </div>
      </div>

      {/* 3. Métricas SaaS Minimalistas */}
      <div className="flex items-center gap-6 sm:gap-8 text-left flex-nowrap justify-end relative z-10 pr-2">
        
        {/* Bloque A: Ventas */}
        <div className="flex flex-col justify-center min-w-[4.5rem]">
          <span className="font-mono text-[0.95rem] font-semibold text-fg tracking-tight leading-none">
            {moneyCompact(ventas)}
          </span>
          <span className="text-xs text-muted flex items-center gap-1 mt-1.5 leading-none font-medium">
             <Banknote className="h-3 w-3 opacity-40" /> {num(unidades)} unidades
          </span>
        </div>

        {/* Bloque B: Ritmo */}
        <div className="flex flex-col justify-center min-w-[4.5rem] hidden md:flex">
          <span className="font-mono text-[0.95rem] font-semibold text-fg tracking-tight leading-none">
            {num2(sku["Velocidad (uds/día)"])} <span className="font-sans font-normal text-xs text-muted ml-0.5">/ día</span>
          </span>
          <span className="text-xs text-muted flex items-center gap-1 mt-1.5 leading-none font-medium">
             <TrendingUp className="h-3 w-3 opacity-40" /> {pct(sku["Sell-through Lote %"])} vendido
          </span>
        </div>

        {/* Bloque C: Inventario */}
        <div className="flex flex-col justify-center min-w-[5rem]">
          <span className="flex items-center gap-1.5 font-mono text-[0.95rem] font-semibold tracking-tight leading-none">
             <span className={cn("shrink-0 w-2 h-2 rounded-full", stock === 0 ? "bg-danger shadow-[0_0_8px_rgba(240,85,109,0.8)]" : "bg-info shadow-[0_0_8px_rgba(62,171,255,0.6)]")} />
             <span className={stock === 0 ? "text-danger" : "text-fg"}>{num(stock)} <span className="font-sans font-normal text-xs text-muted ml-0.5">stock</span></span>
          </span>
          <span className={cn("text-xs flex items-center gap-1 mt-1.5 leading-none font-medium", n(sku["Cobertura"]) < 15 ? "text-danger drop-shadow-[0_0_8px_rgba(240,85,109,0.5)]" : "text-muted")}>
             <Box className="h-3 w-3 opacity-40" /> {s(sku["Cobertura"]) ? `Cob: ${s(sku["Cobertura"])}` : "Sin cob."}
          </span>
        </div>

      </div>

      {/* 4. Acciones */}
      <div className="flex shrink-0 items-center justify-end gap-1 min-w-6 relative z-10">
        {onJumpToCompras && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJumpToCompras();
            }}
            title={isSolicitado ? "Ver solicitud en Compras" : "Pedir en Compras — abre la sugerencia de este SKU"}
            className={cn(
              "flex items-center justify-center rounded-full transition-all active:scale-95",
              isSolicitado
                ? "h-7 px-2.5 gap-1.5 border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                : "h-7 w-7 bg-warning/10 text-warning hover:bg-warning/20"
            )}
          >
            {isSolicitado ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span className="text-[0.65rem] font-bold tracking-widest hidden sm:inline">SOLICITADO</span>
              </>
            ) : (
              <ShoppingCart className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        <span className="flex items-center text-faint group-hover:text-primary transition-all group-hover:translate-x-1 duration-300">
          <ChevronRight className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
});
