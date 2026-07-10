"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRotacionHistorica } from "@/lib/api";
import { useSucursal } from "@/components/sucursal-context";
import type { RotacionHistoricaSku } from "@/lib/types";
import {
  buildTree,
  CURRENT_YEAR,
  EMPTY_FILTER,
  PRESETS,
  yearRange,
  type ParetoFilter,
  type TaxFilter,
} from "../lib";

/**
 * Hook de /rotacion-historica: estado de UI (período, filtros, búsqueda) +
 * fetching de la ventana histórica + derivados (árbol de taxonomía, SKUs
 * filtrados, breadcrumbs de filtro).
 */
export function useRotacionHistorica() {
  const { officeId, sucursalName } = useSucursal();
  const [presetId, setPresetId] = useState<string>("anio-pasado");
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [paretoFilter, setParetoFilter] = useState<ParetoFilter>("todos");
  const [taxFilter, setTaxFilter] = useState<TaxFilter>(EMPTY_FILTER);
  const [search, setSearch] = useState("");

  const range = useMemo(() => {
    if (presetId === "custom" && customRange) return customRange;
    const preset = PRESETS.find((p) => p.id === presetId);
    return preset ? preset.range() : yearRange(CURRENT_YEAR - 1);
  }, [presetId, customRange]);

  const query = useQuery({
    queryKey: ["rotacion-historica", range.from, range.to, officeId],
    queryFn: ({ signal }) =>
      getRotacionHistorica(range.from, range.to, officeId, signal),
    staleTime: 5 * 60_000,
  });

  const tree = useMemo(() => buildTree(query.data?.skus ?? []), [query.data?.skus]);

  const filteredSkus = useMemo<RotacionHistoricaSku[]>(() => {
    const all = query.data?.skus ?? [];
    const s = search.trim().toLowerCase();
    return all.filter((sku) => {
      if (paretoFilter !== "todos" && sku.pareto !== paretoFilter) return false;
      if (taxFilter.dept && sku.departamento !== taxFilter.dept) return false;
      if (taxFilter.cat && sku.categoria !== taxFilter.cat) return false;
      if (taxFilter.subcat && sku.subcategoria !== taxFilter.subcat) return false;
      if (s) {
        const hay =
          sku.sku.toLowerCase().includes(s) ||
          sku.producto.toLowerCase().includes(s) ||
          (sku.categoria ?? "").toLowerCase().includes(s) ||
          (sku.subcategoria ?? "").toLowerCase().includes(s);
        if (!hay) return false;
      }
      return true;
    });
  }, [query.data?.skus, paretoFilter, taxFilter, search]);

  const handleSelectDept = useCallback((dept: string | null) => {
    setTaxFilter((prev) =>
      prev.dept === dept ? EMPTY_FILTER : { dept, cat: null, subcat: null },
    );
  }, []);

  const handleSelectCat = useCallback((dept: string, cat: string | null) => {
    setTaxFilter((prev) =>
      prev.cat === cat ? { dept, cat: null, subcat: null } : { dept, cat, subcat: null },
    );
  }, []);

  const handleSelectSubcat = useCallback((dept: string, cat: string, subcat: string | null) => {
    setTaxFilter((prev) =>
      prev.subcat === subcat ? { dept, cat, subcat: null } : { dept, cat, subcat },
    );
  }, []);

  const hasFilter = taxFilter.dept !== null;

  /** Active filter breadcrumbs */
  const filterBreadcrumbs = useMemo(() => {
    const parts: { label: string; level: "dept" | "cat" | "subcat" }[] = [];
    if (taxFilter.dept) parts.push({ label: taxFilter.dept, level: "dept" });
    if (taxFilter.cat) parts.push({ label: taxFilter.cat, level: "cat" });
    if (taxFilter.subcat) parts.push({ label: taxFilter.subcat, level: "subcat" });
    return parts;
  }, [taxFilter]);

  return {
    officeId,
    sucursalName,
    presetId,
    setPresetId,
    customRange,
    setCustomRange,
    paretoFilter,
    setParetoFilter,
    taxFilter,
    setTaxFilter,
    search,
    setSearch,
    range,
    query,
    tree,
    filteredSkus,
    handleSelectDept,
    handleSelectCat,
    handleSelectSubcat,
    hasFilter,
    filterBreadcrumbs,
  };
}
