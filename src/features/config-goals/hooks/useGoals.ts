"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesVsGoal, setGoals } from "@/lib/api";

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Hook del tab "Metas" de /configuracion. Query de ventas-vs-meta del mes en
 * curso + mutation para persistir las metas por sucursal / global.
 */
export function useGoals() {
  const qc = useQueryClient();
  const month = currentMonth();

  const q = useQuery({
    queryKey: ["sales-vs-goal-edit", month],
    queryFn: ({ signal }) => getSalesVsGoal(month, null, signal),
  });

  const mutation = useMutation({
    mutationFn: (body: {
      meta_global: number | null;
      offices: Record<string, number>;
    }) =>
      setGoals({
        month,
        meta_global: body.meta_global,
        offices: body.offices,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-board"] });
      qc.invalidateQueries({ queryKey: ["sales-vs-goal-edit"] });
    },
  });

  return { q, mutation, month };
}
