"use client";

import { useState, useCallback } from "react";
import {
  downloadInventarioExcel,
  type InventarioExcelParams,
  type InventarioExcelResult,
  ApiError,
} from "@/lib/api";
import { toast } from "@/lib/toast";

interface UseInventarioExcelReturn {
  /** Filtros que se envían al endpoint */
  filters: InventarioExcelParams;
  setFilters: React.Dispatch<React.SetStateAction<InventarioExcelParams>>;
  /** Setter individual por campo */
  setFilter: <K extends keyof InventarioExcelParams>(
    key: K,
    value: InventarioExcelParams[K],
  ) => void;
  /** Lanza la descarga */
  download: () => Promise<void>;
  /** Estado de la descarga */
  isDownloading: boolean;
  /** Último resultado exitoso */
  lastResult: InventarioExcelResult | null;
  /** Último error */
  error: string | null;
  /** Resetea todos los filtros */
  resetFilters: () => void;
}

const DEFAULT_FILTERS: InventarioExcelParams = {
  office_id: null,
  only_with_stock: false,
  include_inactive: false,
  department: "",
  category: "",
  subcategory: "",
  q: "",
};

export function useInventarioExcel(): UseInventarioExcelReturn {
  const [filters, setFilters] = useState<InventarioExcelParams>(DEFAULT_FILTERS);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastResult, setLastResult] = useState<InventarioExcelResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setFilter = useCallback(
    <K extends keyof InventarioExcelParams>(
      key: K,
      value: InventarioExcelParams[K],
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const download = useCallback(async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const result = await downloadInventarioExcel(filters);
      setLastResult(result);

      // Trigger browser download
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        `✅ Descargado: ${result.filename} (${result.totalRows.toLocaleString()} productos)`,
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Error inesperado al descargar el inventario.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  }, [filters]);

  return {
    filters,
    setFilters,
    setFilter,
    download,
    isDownloading,
    lastResult,
    error,
    resetFilters,
  };
}
