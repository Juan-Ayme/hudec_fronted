"use client";

import { useState } from "react";
import { getEcosistema, biQueryKeys } from "@/lib/bi-api";
import { useSucursal } from "@/components/sucursal-context";
import { useBIQuery } from "@/features/bi/shared";
import type { EcosistemaNivel, EcosistemaResponse } from "@/lib/bi-types";

/** Días ofrecidos en el selector de ventana. El backend acepta 30–730. */
export const ECOSISTEMA_PERIODOS = [
  { days: 90, label: "90d" },
  { days: 180, label: "180d" },
  { days: 365, label: "1 año" },
  { days: 730, label: "2 años" },
];

/**
 * Hook principal de `/compras-ecosistema`. Consulta `/compras/ecosistema` con el
 * nivel + ventana elegidos y la sucursal global (`useSucursal`).
 */
export function useEcosistema() {
  const { officeId } = useSucursal();
  const [nivel, setNivel] = useState<EcosistemaNivel>("categoria");
  const [dias, setDias] = useState<number>(365);

  const q = useBIQuery<EcosistemaResponse>({
    queryKey: biQueryKeys.ecosistema(officeId, nivel, dias),
    queryFn: ({ signal }) =>
      getEcosistema({ office_id: officeId, nivel, dias }, signal),
  });

  return { q, officeId, nivel, setNivel, dias, setDias };
}
