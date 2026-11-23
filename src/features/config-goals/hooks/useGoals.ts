"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalesVsGoal, setGoals } from "@/lib/api";

export function currentMonth(): string {
  // Mes local (Lima). Con toISOString() era el de UTC: el último día del mes, desde las
  // 7 pm, la pantalla de metas ya mostraba el mes siguiente.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
