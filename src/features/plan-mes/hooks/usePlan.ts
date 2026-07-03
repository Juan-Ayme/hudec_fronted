"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { setGoals } from "@/lib/api";
import { getPlan, biQueryKeys } from "@/lib/bi-api";
import { useSucursal } from "@/components/sucursal-context";
import { useBIQuery } from "@/features/bi/shared";
import type { PlanResponse } from "@/lib/bi-types";

export type MesesCalendario = 3 | 6 | 12;

/** Hook principal de `/plan-mes`. Consulta `/plan` y expone mutation para guardar meta. */
export function usePlan() {
  const { officeId } = useSucursal();
  const [meses, setMeses] = useState<MesesCalendario>(3);

  const q = useBIQuery<PlanResponse>({
    queryKey: biQueryKeys.plan(officeId, meses),
    queryFn: ({ signal }) =>
      getPlan({ office_id: officeId, meses_calendario: meses }, signal),
  });

  const qc = useQueryClient();

  const saveGoal = useMutation({
    mutationFn: async ({
      month,
      totalMeta,
      offices,
    }: {
      month: string;
      totalMeta: number | null;
      offices: Record<string, number>;
    }) =>
      setGoals({
        month,
        meta_global: totalMeta,
        offices,
      }),
    onSuccess: (_data, vars) => {
      toast.success(`Meta guardada para ${vars.month}`);
      qc.invalidateQueries({ queryKey: ["bi"] });
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (err: Error) =>
      toast.error("No se pudo guardar la meta", { description: err.message }),
  });

  return { q, officeId, meses, setMeses, saveGoal };
}
