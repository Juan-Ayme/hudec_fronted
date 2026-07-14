import { useState, useMemo } from "react";
import type { Selection } from "@/lib/types";
import { Row, KanbanCol } from "../types";
import { n, s, getKanbanColumn } from "../utils";
import { KANBAN_COLS } from "../utils/kanbanConfig";
import { buildSimilarityIndex } from "../utils/similarity";
import {
  normDept,
  normCat,
  normSubcat,
} from "@/features/centro-catalogo/utils/buildUnifiedTree";

/**
 * Estado del panel Rendimiento (lado derecho de /centro-catalogo).
 * Versión recortada de useVentasJerarquicas: la búsqueda global y la
 * selección del árbol llegan desde el contenedor; acá viven el tab kanban,
 * los filtros avanzados, la paginación y el SKU seleccionado (drawer).
 */
export function useRendimientoPanel({
  rows,
  allRows,
  selection,
}: {
  /** Filas post-búsqueda global (alimentan lista y conteos). */
  rows: Row[];
  /** Universo completo — similares y "abrir similar" ven todo el catálogo. */
  allRows: Row[];
  selection: Selection;
}) {
  const [selectedSku, setSelectedSku] = useState<Row | null>(null);

  /* Tab del Kanban activo */
  const [activeTab, setActiveTab] = useState<KanbanCol>("comprar");

  /* Paginación dentro del tab */
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  /* Filtros avanzados */
  const [fStock, setFStock] = useState<"todos" | "con_stock" | "sin_stock">("todos");
  const [fDias, setFDias] = useState<"todos" | "7" | "15" | "30">("todos");
  const [fMesIngreso, setFMesIngreso] = useState<Set<string>>(new Set());
  const [mesDropdownOpen, setMesDropdownOpen] = useState(false);
  const [fXYZ, setFXYZ] = useState<"todos" | "X" | "Y" | "Z">("todos");
  const [fTendencia, setFTendencia] = useState<"todos" | "creciendo" | "estable" | "bajando">("todos");
  const [fCobertura, setFCobertura] = useState<"todos" | "critica_10" | "critica" | "baja" | "ok">("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const similarityIndex = useMemo(() => buildSimilarityIndex(allRows), [allRows]);

  const mesesDisponibles = useMemo(() => {
    const setMeses = new Set<string>();
    for (const r of allRows) {
      const d = s(r["Últ. Recepción"]);
      if (d && d.length >= 7) {
        setMeses.add(d.substring(0, 7)); // Extrae "YYYY-MM"
      }
    }
    return Array.from(setMeses).sort().reverse();
  }, [allRows]);

  const rowsFiltradas = useMemo(() => {
    let out = rows;

    if (fStock !== "todos") {
      out = out.filter(r => fStock === "con_stock" ? n(r["Stock Disp"]) > 0 : n(r["Stock Disp"]) <= 0);
    }
    if (fDias !== "todos") {
      const minDias = parseInt(fDias, 10);
      out = out.filter(r => n(r["Días sin Vender"]) >= minDias);
    }
    if (fMesIngreso.size > 0) {
      out = out.filter(r => {
        const d = s(r["Últ. Recepción"]);
        return d && d.length >= 7 && fMesIngreso.has(d.substring(0, 7));
      });
    }
    if (fXYZ !== "todos") {
      out = out.filter(r => s(r["XYZ"]).toUpperCase().startsWith(fXYZ));
    }
    if (fTendencia !== "todos") {
      out = out.filter(r => {
        const t = s(r["Tendencia"]).toUpperCase();
        if (fTendencia === "creciendo") return t.includes("CRECIENDO");
        if (fTendencia === "bajando") return t.includes("BAJANDO");
        return t.includes("ESTABLE") || t === "" || (!t.includes("CRECIENDO") && !t.includes("BAJANDO"));
      });
    }
    if (fCobertura !== "todos") {
      out = out.filter(r => {
        const cob = n(r["Cobertura"]);
        if (fCobertura === "critica_10") return cob <= 10;
        if (fCobertura === "critica") return cob < 15;
        if (fCobertura === "baja") return cob >= 15 && cob <= 30;
        return cob > 30;
      });
    }
    return out;
  }, [rows, fStock, fDias, fMesIngreso, fXYZ, fTendencia, fCobertura]);

  const skusFiltrados = useMemo(() => {
    return rowsFiltradas
      .filter((r) => {
        // Nombres normalizados — así los nodos fallback del árbol
        // ("Sin departamento", …) también matchean sus filas.
        const dMatch = selection.dept ? normDept(s(r["Departamento"])) === selection.dept : true;
        const cMatch = selection.cat ? normCat(s(r["Categoría"])) === selection.cat : true;
        const sMatch = selection.subcat ? normSubcat(s(r["Subcategoría"])) === selection.subcat : true;
        return dMatch && cMatch && sMatch;
      })
      .sort((a, b) => n(b["Vendido SKU S/"]) - n(a["Vendido SKU S/"]));
  }, [rowsFiltradas, selection]);

  const tabCounts = useMemo(() => {
    const counts: Record<KanbanCol, number> = {
      comprar: 0, alertas: 0, vigilar: 0, lentos: 0, liquidar: 0,
    };
    for (const r of skusFiltrados) {
      counts[getKanbanColumn(r)] += 1;
    }
    return counts;
  }, [skusFiltrados]);

  const sortedCols = useMemo(() => {
    return [...KANBAN_COLS].sort((a, b) => {
      const baseOrder = ["vigilar", "lentos", "comprar", "liquidar", "alertas"];
      const countA = tabCounts[a.id] || 0;
      const countB = tabCounts[b.id] || 0;
      const hasA = countA > 0 ? 1 : 0;
      const hasB = countB > 0 ? 1 : 0;
      if (hasA !== hasB) return hasB - hasA;
      return baseOrder.indexOf(a.id) - baseOrder.indexOf(b.id);
    });
  }, [tabCounts]);

  const tabItems = useMemo(
    () => skusFiltrados.filter((r) => getKanbanColumn(r) === activeTab),
    [skusFiltrados, activeTab],
  );

  const totalPages = Math.max(1, Math.ceil(tabItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = useMemo(
    () => tabItems.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
    [tabItems, safePage],
  );

  // Reset de página y tab al cambiar selección/filas/filtros (patrón
  // render-time, como useComprasCatalogo). prevRows arranca en null para que
  // el primer render con datos también seleccione la primera columna con
  // items, igual que hacía el efecto de la página original.
  const [prevRows, setPrevRows] = useState<Row[] | null>(null);
  const [prevSelection, setPrevSelection] = useState(selection);
  const [prevFStock, setPrevFStock] = useState(fStock);
  const [prevFDias, setPrevFDias] = useState(fDias);
  const [prevFMesIngreso, setPrevFMesIngreso] = useState(fMesIngreso);
  const [prevFXYZ, setPrevFXYZ] = useState(fXYZ);
  const [prevFTendencia, setPrevFTendencia] = useState(fTendencia);
  const [prevFCobertura, setPrevFCobertura] = useState(fCobertura);

  if (
    rows !== prevRows ||
    selection !== prevSelection ||
    fStock !== prevFStock ||
    fDias !== prevFDias ||
    fMesIngreso !== prevFMesIngreso ||
    fXYZ !== prevFXYZ ||
    fTendencia !== prevFTendencia ||
    fCobertura !== prevFCobertura
  ) {
    setPrevRows(rows);
    setPrevSelection(selection);
    setPrevFStock(fStock);
    setPrevFDias(fDias);
    setPrevFMesIngreso(fMesIngreso);
    setPrevFXYZ(fXYZ);
    setPrevFTendencia(fTendencia);
    setPrevFCobertura(fCobertura);
    setCurrentPage(1);
    // Siempre selecciona la primera columna (botón) resultante de nuestro orden dinámico
    if (sortedCols.length > 0) {
      setActiveTab(sortedCols[0].id);
    }
  }

  const hasActiveAdvancedFilters =
    fXYZ !== "todos" ||
    fTendencia !== "todos" ||
    fCobertura !== "todos";

  const hasActiveFilters =
    fStock !== "todos" ||
    fDias !== "todos" ||
    fMesIngreso.size > 0 ||
    hasActiveAdvancedFilters;

  return {
    selectedSku, setSelectedSku,
    activeTab, setActiveTab,
    currentPage, setCurrentPage,
    ITEMS_PER_PAGE,
    fStock, setFStock,
    fDias, setFDias,
    fMesIngreso, setFMesIngreso,
    mesDropdownOpen, setMesDropdownOpen,
    fXYZ, setFXYZ,
    fTendencia, setFTendencia,
    fCobertura, setFCobertura,
    showFilters, setShowFilters,
    showAdvancedFilters, setShowAdvancedFilters,
    mesesDisponibles,
    skusFiltrados,
    tabCounts,
    tabItems,
    totalPages,
    safePage,
    pageItems,
    hasActiveFilters,
    hasActiveAdvancedFilters,
    similarityIndex,
    sortedCols,
  };
}
