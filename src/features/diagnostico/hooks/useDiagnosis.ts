"use client";

import { useState } from "react";
import { getDiagnosis, biQueryKeys } from "@/lib/bi-api";
import { useSucursal } from "@/components/sucursal-context";
import { useBIQuery } from "@/features/bi/shared";
import type { DiagnosisResponse } from "@/lib/bi-types";

export type VentanaDias = 7 | 14 | 28;
export type TopNLista = 10 | 20 | 50;

/**
 * Hook principal de `/diagnostico`. Maneja los controles locales
 * (ventana y top_n) y dispara refetch con react-query cuando cambian.
 */
export function useDiagnosis() {
  const { officeId } = useSucursal();
  const [days, setDays] = useState<VentanaDias>(7);
  const [topN, setTopN] = useState<TopNLista>(10);

  const q = useBIQuery<DiagnosisResponse>({
    queryKey: biQueryKeys.diagnosis(officeId, days, topN),
    queryFn: ({ signal }) =>
      getDiagnosis({ days, office_id: officeId, top_n: topN }, signal),
  });

  return { q, officeId, days, setDays, topN, setTopN };
}
