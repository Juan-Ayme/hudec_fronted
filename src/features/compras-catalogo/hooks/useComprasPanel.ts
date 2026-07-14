"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  createPurchaseDecision,
  type PurchaseDecisionKind,
  type PurchaseDecision,
} from "@/lib/api";
import type { ComprasCatalogoSku, Selection } from "@/lib/types";
import { SeverityFilter, TendenciaFilter, StockFilter } from "../types";
import {
  normDept,
  normCat,
  normSubcat,
} from "@/features/centro-catalogo/utils/buildUnifiedTree";

/**
 * Estado del panel Decisiones de Compra (lado derecho de /centro-catalogo).
 * Versión recortada de useComprasCatalogo: el query, la búsqueda global, la
 * selección del árbol y el query de solicitadas viven en el contenedor; acá
 * quedan los filtros propios, la paginación, el SKU del drawer y la mutación.
 */
export function useComprasPanel({
  skus,
  selection,
  solicitadasBySku,
  officeId,
}: {
  /** SKUs post-búsqueda global (pre-selección). */
  skus: ComprasCatalogoSku[];
  selection: Selection;
  solicitadasBySku: Map<string, PurchaseDecision>;
  officeId: number | null;
}) {
  const [fSeveridad, setFSeveridad] = useState<SeverityFilter>("todas");
  const [fTendencia, setFTendencia] = useState<TendenciaFilter>("todas");
  const [fStockAlmacen, setFStockAlmacen] = useState<StockFilter>("todos");
  // Bandeja de solicitudes: mostrar solo SKUs cuya decisión vigente es 'solicitado'.
  const [fSolicitado, setFSolicitado] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedSku, setSelectedSku] = useState<ComprasCatalogoSku | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // We reset page if filters change (patrón render-time, igual que el hook original;
  // `skus` reemplaza a `search`: su identidad cambia cuando cambia la búsqueda global).
  const [prevSkus, setPrevSkus] = useState(skus);
  const [prevSeverity, setPrevSeverity] = useState(fSeveridad);
  const [prevSelection, setPrevSelection] = useState(selection);
  const [prevTendencia, setPrevTendencia] = useState(fTendencia);
  const [prevStockAlmacen, setPrevStockAlmacen] = useState(fStockAlmacen);
  const [prevSolicitado, setPrevSolicitado] = useState(fSolicitado);

  if (
    skus !== prevSkus ||
    fSeveridad !== prevSeverity ||
    selection !== prevSelection ||
    fTendencia !== prevTendencia ||
    fStockAlmacen !== prevStockAlmacen ||
    fSolicitado !== prevSolicitado
  ) {
    setPrevSkus(skus);
    setPrevSeverity(fSeveridad);
    setPrevSelection(selection);
    setPrevTendencia(fTendencia);
    setPrevStockAlmacen(fStockAlmacen);
    setPrevSolicitado(fSolicitado);
    setCurrentPage(1);
  }

  const filteredSkus = useMemo<ComprasCatalogoSku[]>(() => {
    return skus.filter((sku) => {
      if (fSeveridad === "critico" && !sku.severidad.includes("Crítico")) return false;
      if (fSeveridad === "alta" && !sku.severidad.includes("Alta")) return false;

      if (fTendencia === "creciente" && sku.tendencia !== "Creciente") return false;
      if (fTendencia === "estable" && sku.tendencia !== "Estable") return false;
      if (fTendencia === "decreciente" && sku.tendencia !== "Decreciente") return false;

      if (fStockAlmacen === "con_stock" && sku.stock_almacen <= 0) return false;
      if (fStockAlmacen === "sin_stock" && sku.stock_almacen > 0) return false;

      if (fSolicitado && !solicitadasBySku.has(sku.sku)) return false;

      // Nombres normalizados — los nodos fallback del árbol ("Sin
      // departamento", …) también deben matchear sus SKUs.
      if (selection.dept && normDept(sku.departamento) !== selection.dept) return false;
      if (selection.cat && normCat(sku.categoria) !== selection.cat) return false;
      if (selection.subcat && normSubcat(sku.subcategoria) !== selection.subcat) return false;

      return true;
    });
  }, [skus, fSeveridad, fTendencia, fStockAlmacen, fSolicitado, solicitadasBySku, selection]);

  const qc = useQueryClient();
  const quickAction = useMutation({
    mutationFn: ({ sku, action }: { sku: ComprasCatalogoSku; action: PurchaseDecisionKind }) =>
      createPurchaseDecision({
        sku: sku.sku,
        bsale_office_id: officeId ?? 0,
        decision: action,
        quantity: action === "ordenar" || action === "comprar_similar" ? sku.cantidad_sugerida : null,
        classification_snapshot: {
          clasificacion: sku.clasificacion,
          severidad: sku.severidad,
          accion: sku.accion,
          stock_disponible: sku.stock_disponible,
          cantidad_sugerida: sku.cantidad_sugerida,
        },
      }),
    onSuccess: (_data, vars) => {
      const verb = { solicitado: "Solicitar", ordenar: "Ordenar", comprar_similar: "Comprar similar", posponer: "Posponer", ignorar: "Ignorar" }[vars.action];
      toast.success(`${verb} · ${vars.sku.producto}`, { description: "Decisión guardada." });
      qc.invalidateQueries({ queryKey: ["purchase-decisions"] });
    },
    onError: (err: Error, vars) => {
      toast.error(`Error guardando decisión · ${vars.sku.producto}`, { description: err.message });
    },
  });

  const handleAction = (sku: ComprasCatalogoSku, action: PurchaseDecisionKind) => {
    if (officeId == null) {
      toast.error("Seleccioná una sucursal antes de decidir compras.");
      return;
    }
    quickAction.mutate({ sku, action });
  };

  const totalPages = Math.max(1, Math.ceil(filteredSkus.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = useMemo(
    () => filteredSkus.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    [filteredSkus, safePage],
  );

  return {
    filteredSkus,
    quickAction,
    handleAction,
    fSeveridad, setFSeveridad,
    fTendencia, setFTendencia,
    fStockAlmacen, setFStockAlmacen,
    fSolicitado, setFSolicitado,
    showFilters, setShowFilters,
    selectedSku, setSelectedSku,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    pageItems,
    ITEMS_PER_PAGE,
  };
}
