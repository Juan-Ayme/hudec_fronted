"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAudits,
  fixNaming,
  getOrphansWithoutProducts,
} from "@/lib/api";
import { num } from "@/lib/format";
import type { IssueSource } from "@/lib/types";

/**
 * Hook de /auditorias: queries de auditoría + huérfanos, mutation de
 * auto-fix de nombres, estado de UI (sección expandida, resultado del fix) y
 * el conteo de issues por ORIGEN para los KPI cards.
 */
export function useAuditorias() {
  const qc = useQueryClient();
  const audits = useQuery({
    queryKey: ["audits"],
    queryFn: ({ signal }) => getAudits(signal),
  });
  const orphans = useQuery({
    queryKey: ["orphans-without-products"],
    queryFn: ({ signal }) => getOrphansWithoutProducts(signal),
  });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [fixResult, setFixResult] = useState<string | null>(null);

  const fixMut = useMutation({
    mutationFn: (dryRun: boolean) => fixNaming(null, dryRun),
    onSuccess: (data) => {
      if (data.dry_run) {
        setFixResult(
          `Previsualización: ${num(data.totals.candidates)} nombres se corregirían.`,
        );
      } else {
        setFixResult(
          `Listo: ${num(data.totals.fixed)} corregidos, ${num(
            data.totals.failed,
          )} fallidos.`,
        );
        qc.invalidateQueries({ queryKey: ["audits"] });
        qc.invalidateQueries({ queryKey: ["product-types"] });
      }
    },
  });

  const data = audits.data;

  // Categorizar issues por ORIGEN para los 3 KPI cards de arriba.
  const byOrigin = useMemo(() => {
    const out = { bsale: 0, local_db: 0, both: 0 } as Record<IssueSource, number>;
    if (!data) return out;
    if (data.side_counts) {
      out.bsale = data.side_counts.bsale;
      out.local_db = data.side_counts.local_db;
      out.both = data.side_counts.both;
      return out;
    }
    // Fallback si el backend no envía side_counts
    for (const [key, count] of Object.entries(data.summary)) {
      if (count <= 0) continue;
      const src = data.meta?.[key]?.source ?? "both";
      out[src] += count;
    }
    return out;
  }, [data]);

  return {
    audits,
    orphans,
    expanded,
    setExpanded,
    fixResult,
    fixMut,
    byOrigin,
  };
}
