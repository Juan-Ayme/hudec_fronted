"use client";

import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  bulkDeactivateProducts,
  type BulkDeactivateResponse,
  ApiError,
} from "@/lib/api";
import { toast } from "@/lib/toast";

export function useBulkDeactivate() {
  const queryClient = useQueryClient();
  const [rawInput, setRawInput] = useState<string>("");
  const [forzarConStock, setForzarConStock] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<BulkDeactivateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parsea y deduplica los SKUs introducidos por el usuario
  const parsedSkus = useMemo(() => {
    if (!rawInput.trim()) return [];
    const tokens = rawInput
      .split(/[\r\n,;\t]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    // Elimina duplicados conservando el orden de aparición
    return Array.from(new Set(tokens));
  }, [rawInput]);

  const simulate = useCallback(async () => {
    if (parsedSkus.length === 0) {
      toast.error("Ingresa al menos un SKU o código de barras para simular.");
      return;
    }

    setIsSimulating(true);
    setError(null);
    try {
      const res = await bulkDeactivateProducts({
        skus: parsedSkus,
        dry_run: true,
        forzar_con_stock: forzarConStock,
      });
      setResult(res);
      toast.info(
        `🔍 Simulación completada: ${res.totals.to_deactivate} listos para desactivar, ${res.totals.blocked_by_stock} con stock bloqueados.`,
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Error al simular la desactivación de productos.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSimulating(false);
    }
  }, [parsedSkus, forzarConStock]);

  const execute = useCallback(async () => {
    if (parsedSkus.length === 0) {
      toast.error("Ingresa al menos un SKU o código de barras para desactivar.");
      return;
    }

    setIsExecuting(true);
    setError(null);
    try {
      const res = await bulkDeactivateProducts({
        skus: parsedSkus,
        dry_run: false,
        forzar_con_stock: forzarConStock,
      });
      setResult(res);
      const count =
        res.totals.deactivated ??
        res.totals.to_deactivate ??
        res.deactivated?.length ??
        0;
      toast.success(
        `✅ Desactivación ejecutada: ${count} productos desactivados en BSale y BD.`,
      );

      // Invalida la caché de queries relacionadas para reflejar los cambios en tiempo real
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ["stock-valuation"] }),
        queryClient.invalidateQueries({ queryKey: ["centro-catalogo"] }),
        queryClient.invalidateQueries({ queryKey: ["compras-catalogo"] }),
        queryClient.invalidateQueries({ queryKey: ["taxonomy"] }),
        queryClient.invalidateQueries({ queryKey: ["catalog-health"] }),
        queryClient.invalidateQueries({ queryKey: ["matrix04b"] }),
      ]);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Error al ejecutar la desactivación de productos.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsExecuting(false);
    }
  }, [parsedSkus, forzarConStock]);

  const resetAll = useCallback(() => {
    setRawInput("");
    setForzarConStock(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    rawInput,
    setRawInput,
    parsedSkus,
    forzarConStock,
    setForzarConStock,
    isSimulating,
    isExecuting,
    result,
    error,
    simulate,
    execute,
    resetAll,
  };
}
