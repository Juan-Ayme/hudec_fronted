"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getExclusions, setExclusions } from "@/lib/api";

/**
 * Hook del tab "Departamentos" de /configuracion. Query de exclusiones +
 * mutation que persiste los sets excluidos / estacionales (preservando las
 * categorías excluidas del server).
 */
export function useDepartments() {
  const qc = useQueryClient();

  const cfg = useQuery({
    queryKey: ["config-exclusions"],
    queryFn: ({ signal }) => getExclusions(signal),
  });

  const mutation = useMutation({
    mutationFn: (body: {
      excluded_departments: number[];
      seasonal_departments: number[];
    }) =>
      setExclusions({
        excluded_departments: body.excluded_departments,
        excluded_categories: cfg.data?.excluded_categories ?? [],
        seasonal_departments: body.seasonal_departments,
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("matrix"),
      });
      qc.invalidateQueries({ queryKey: ["config-exclusions"] });
    },
  });

  return { cfg, mutation };
}
