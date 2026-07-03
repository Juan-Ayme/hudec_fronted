"use client";

import { getPulse, biQueryKeys } from "@/lib/bi-api";
import { useSucursal } from "@/components/sucursal-context";
import { useBIQuery } from "@/features/bi/shared";
import type { PulseResponse } from "@/lib/bi-types";

/**
 * Hook principal de la vista `/pulso`. Consume `/pulse` con el office_id de la
 * sucursal activa. El X-Company-Id lo inyecta request() bajo el capó.
 */
export function usePulse() {
  const { officeId } = useSucursal();
  const q = useBIQuery<PulseResponse>({
    queryKey: biQueryKeys.pulse(officeId),
    queryFn: ({ signal }) => getPulse(officeId, signal),
  });
  return { q, officeId };
}
