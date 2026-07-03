"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  backfillVariantCosts,
  getVariantCostsAudit,
  biQueryKeys,
} from "@/lib/bi-api";
import type { VariantCostBackfillResult } from "@/lib/bi-types";

/** Hook admin del tab "Costos" de /configuracion. */
export function useVariantCosts() {
  const qc = useQueryClient();

  const audit = useQuery({
    queryKey: biQueryKeys.variantCostsAudit(),
    queryFn: ({ signal }) => getVariantCostsAudit(signal),
    staleTime: 60_000,
  });

  const backfill = useMutation<VariantCostBackfillResult, Error, boolean>({
    mutationFn: (dry_run) => backfillVariantCosts(dry_run),
    onSuccess: (data) => {
      if (data.dry_run) {
        toast.info(
          `Dry run: ${data.actualizados} actualizarían de ${data.candidatos_total} candidatos`,
        );
      } else {
        toast.success(
          `Backfill ejecutado: ${data.actualizados} costos recuperados`,
        );
        qc.invalidateQueries({ queryKey: ["bi"] });
      }
    },
    onError: (err) =>
      toast.error("Error en el backfill", { description: err.message }),
  });

  return { audit, backfill };
}
