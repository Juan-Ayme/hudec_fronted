"use client";

import { useState } from "react";
import {
  getCatalogHealth,
  biQueryKeys,
} from "@/lib/bi-api";
import { useSucursal } from "@/components/sucursal-context";
import { useBIQuery } from "@/features/bi/shared";
import type { CatalogHealthResponse } from "@/lib/bi-types";

export type TopNCatalog = 15 | 25 | 50;

/**
 * Hook principal de `/salud-catalogo`. Consulta `/catalog-health`.
 */
export function useCatalogHealth() {
  const { officeId } = useSucursal();
  const [topN, setTopN] = useState<TopNCatalog>(15);

  const q = useBIQuery<CatalogHealthResponse>({
    queryKey: biQueryKeys.catalogHealth(officeId, topN),
    queryFn: ({ signal }) =>
      getCatalogHealth({ office_id: officeId, top_n: topN }, signal),
  });

  return {
    q,
    officeId,
    topN,
    setTopN,
  };
}
