"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCompany,
  setCompany,
  getCompanyRecommendations,
  type CompanyValues,
} from "@/lib/api";

/**
 * Hook del tab "Empresa" de /configuracion. Query de config de empresa +
 * mutation de guardado + mutation de "sugerir configuración" (esta última
 * sólo pre-carga el formulario: su onSuccess de estado local vive en el panel
 * como callback por-llamada).
 */
export function useCompany() {
  const qc = useQueryClient();

  const cfg = useQuery({
    queryKey: ["config-company"],
    queryFn: ({ signal }) => getCompany(signal),
  });

  const mutation = useMutation({
    mutationFn: (body: Partial<CompanyValues>) => setCompany(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["config-company"] });
    },
  });

  const suggestMutation = useMutation({
    mutationFn: () => getCompanyRecommendations(),
  });

  return { cfg, mutation, suggestMutation };
}
