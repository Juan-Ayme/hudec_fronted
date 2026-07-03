"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  bootstrapCategoryTargets,
  getCatalogHealth,
  previewCategoryTargets,
  biQueryKeys,
} from "@/lib/bi-api";
import { useSucursal } from "@/components/sucursal-context";
import { useBIQuery } from "@/features/bi/shared";
import type { CatalogHealthResponse, CategoryTargetsPreview } from "@/lib/bi-types";

export type TopNCatalog = 15 | 25 | 50;

/**
 * Hook principal de `/salud-catalogo`. Consulta `/catalog-health` y expone las
 * mutations para bootstrappear los category_targets desde la misma vista.
 */
export function useCatalogHealth() {
  const { officeId } = useSucursal();
  const [topN, setTopN] = useState<TopNCatalog>(15);

  const q = useBIQuery<CatalogHealthResponse>({
    queryKey: biQueryKeys.catalogHealth(officeId, topN),
    queryFn: ({ signal }) =>
      getCatalogHealth({ office_id: officeId, top_n: topN }, signal),
  });

  const qc = useQueryClient();

  const preview = useMutation<CategoryTargetsPreview, Error>({
    mutationFn: () => previewCategoryTargets(),
    onError: (err) =>
      toast.error("No se pudo generar el preview", { description: err.message }),
  });

  const bootstrap = useMutation<
    { ok: true; filas_insertadas: number; filas_borradas: number; force: boolean },
    Error,
    { force: boolean }
  >({
    mutationFn: ({ force }) => bootstrapCategoryTargets(force),
    onSuccess: (data) => {
      toast.success(
        data.force
          ? `Reset con ${data.filas_insertadas} categorías`
          : `Bootstrap completo: ${data.filas_insertadas} categorías cargadas`,
      );
      qc.invalidateQueries({ queryKey: ["bi"] });
    },
    onError: (err) =>
      toast.error("Error al ejecutar el bootstrap", { description: err.message }),
  });

  return {
    q,
    officeId,
    topN,
    setTopN,
    preview,
    bootstrap,
  };
}
