"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBackups,
  createManualSnapshot,
  restoreBackup,
  deleteBackup,
  importConfig,
} from "@/lib/api";

/**
 * Hook del tab "Respaldos" de /configuracion. Filtro por sección + query del
 * historial + mutations (snapshot manual, restore, delete, import). El export
 * y el import viven en el panel porque tocan el DOM (descarga / File API).
 */
export function useBackups() {
  const qc = useQueryClient();
  const [filterKey, setFilterKey] = useState<string>("");

  const backups = useQuery({
    queryKey: ["config-backups", filterKey],
    queryFn: ({ signal }) => getBackups(filterKey || null, signal),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["config-backups"] });
    qc.invalidateQueries({ queryKey: ["config-exclusions"] });
    qc.invalidateQueries({ queryKey: ["config-thresholds"] });
    qc.invalidateQueries({ queryKey: ["config-company"] });
    qc.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).startsWith("matrix"),
    });
  };

  const snapshotMut = useMutation({
    mutationFn: (label: string) => createManualSnapshot(label),
    onSuccess: () => invalidateAll(),
  });

  const restoreMut = useMutation({
    mutationFn: (id: number) => restoreBackup(id),
    onSuccess: () => invalidateAll(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteBackup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config-backups"] }),
  });

  const importMut = useMutation({
    mutationFn: ({
      config,
      label,
    }: {
      config: Record<string, unknown>;
      label?: string;
    }) => importConfig(config, label),
    onSuccess: () => invalidateAll(),
  });

  return {
    filterKey,
    setFilterKey,
    backups,
    snapshotMut,
    restoreMut,
    deleteMut,
    importMut,
  };
}
