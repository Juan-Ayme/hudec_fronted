"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  bootstrapCategoryTargets,
  deleteCategoryTarget,
  listCategoryTargets,
  updateCategoryTarget,
  biQueryKeys,
} from "@/lib/bi-api";
import type { CategoryTargetPatch } from "@/lib/bi-types";

/**
 * Hook admin del tab "Category Targets" de /configuracion. Expone la lista +
 * mutations para editar, eliminar y reset-con-force.
 * Filtro por sucursal es opcional (por default trae todo).
 */
export function useCategoryTargets(office_id: number | null = null) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: biQueryKeys.categoryTargets(office_id),
    queryFn: ({ signal }) => listCategoryTargets(office_id, signal),
    staleTime: 60_000,
  });

  const update = useMutation({
    mutationFn: (vars: {
      category_id: number;
      office_id: number;
      patch: CategoryTargetPatch;
    }) => updateCategoryTarget(vars.category_id, vars.office_id, vars.patch),
    onSuccess: () => {
      toast.success("Target actualizado");
      qc.invalidateQueries({ queryKey: ["bi"] });
    },
    onError: (err: Error) =>
      toast.error("No se pudo actualizar", { description: err.message }),
  });

  const remove = useMutation({
    mutationFn: (vars: { category_id: number; office_id: number }) =>
      deleteCategoryTarget(vars.category_id, vars.office_id),
    onSuccess: () => {
      toast.success("Target eliminado");
      qc.invalidateQueries({ queryKey: ["bi"] });
    },
    onError: (err: Error) =>
      toast.error("No se pudo eliminar", { description: err.message }),
  });

  const reset = useMutation({
    mutationFn: (force: boolean) => bootstrapCategoryTargets(force),
    onSuccess: (data) => {
      toast.success(
        data.force
          ? `Reset con ${data.filas_insertadas} categorías`
          : `Bootstrap: ${data.filas_insertadas} categorías cargadas`,
      );
      qc.invalidateQueries({ queryKey: ["bi"] });
    },
    onError: (err: Error) =>
      toast.error("Error en el bootstrap", { description: err.message }),
  });

  return { list, update, remove, reset };
}
