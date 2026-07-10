"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getThresholds, setThresholds } from "@/lib/api";

/**
 * Hook del tab "Umbrales" de /configuracion. Query de thresholds/defaults/
 * sections + mutation que persiste sólo las claves cambiadas.
 */
export function useThresholds() {
  const qc = useQueryClient();

  const cfg = useQuery({
    queryKey: ["config-thresholds"],
    queryFn: ({ signal }) => getThresholds(signal),
  });

  const mutation = useMutation({
    mutationFn: (body: Record<string, number>) => setThresholds(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config-thresholds"] });
    },
  });

  return { cfg, mutation };
}
