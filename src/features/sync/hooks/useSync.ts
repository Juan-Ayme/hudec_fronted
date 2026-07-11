"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  triggerIncremental,
  triggerFullSync,
  getSyncTasks,
  getSyncLog,
  getDataQuality,
} from "@/lib/api";
import { num } from "@/lib/format";
import { humanizeError, parseTs } from "@/lib/sync-i18n";
import type { SyncTask } from "@/lib/types";

/**
 * Hook de /sync: estado de UI (parámetros de sync completa, mensaje del
 * incremental) + queries con polling (tareas, log, calidad de datos) +
 * mutations (incremental, completa) + derivados (tarea activa, corrida en
 * vivo, resumen de logs).
 */
export function useSync() {
  const qc = useQueryClient();
  const [days, setDays] = useState(7);
  const [skipDocs, setSkipDocs] = useState(false);
  const [skipStock, setSkipStock] = useState(false);
  const [incrMsg, setIncrMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  // ── Tareas (polling cuando hay actividad) ──
  const tasks = useQuery({
    queryKey: ["sync-tasks"],
    queryFn: ({ signal }) => getSyncTasks(signal),
    refetchInterval: (query) => {
      const data = query.state.data as SyncTask[] | undefined;
      const active = data?.some(
        (t) => t.status === "RUNNING" || t.status === "QUEUED",
      );
      return active ? 3000 : 15000;
    },
  });

  // ── Task RUNNING/QUEUED del API (si existe) ──
  const activeTask = useMemo(
    () =>
      tasks.data?.find(
        (t) => t.status === "RUNNING" || t.status === "QUEUED",
      ) ?? null,
    [tasks.data],
  );

  // Log: arrancamos polling rápido si hay task activa O actividad reciente
  // (la inicial es 20s; el effect de abajo lo acelera cuando detecta logs RUNNING)
  const log = useQuery({
    queryKey: ["sync-log"],
    queryFn: ({ signal }) => getSyncLog(80, signal),
    refetchInterval: (q) => {
      if (activeTask) return 2500;
      const data = q.state.data as { status: string }[] | undefined;
      const liveLog = data?.some((r) => /running/i.test(r.status));
      return liveLog ? 2500 : 20000;
    },
  });

  // ── ¿Hay corrida activa? (task API o log CLI) ──
  // CLI run: log entries con status=running. Mostramos el monitor igual,
  // pasándole task=null para que se ancle al cluster del log.
  const liveLog = useMemo(
    () => (log.data ?? []).some((r) => /running/i.test(r.status)),
    [log.data],
  );
  const hasActiveRun = Boolean(activeTask) || liveLog;

  const dq = useQuery({
    queryKey: ["data-quality"],
    queryFn: ({ signal }) => getDataQuality(60, signal),
    refetchInterval: hasActiveRun ? 5000 : false,
  });

  // ── Mutaciones ──
  const incrMut = useMutation({
    mutationFn: () => triggerIncremental(),
    onSuccess: (data) => {
      const huerfanos = (data as { productos_huerfanos?: number })
        .productos_huerfanos;
      setIncrMsg({
        kind: "ok",
        text: `Sync incremental lista${
          huerfanos != null ? ` · ${num(huerfanos)} productos huérfanos detectados` : ""
        }.`,
      });
      qc.invalidateQueries({ queryKey: ["sync-log"] });
      qc.invalidateQueries({ queryKey: ["sync-tasks"] });
      qc.invalidateQueries({ queryKey: ["products-summary"] });
      qc.invalidateQueries({ queryKey: ["product-types"] });
    },
    onError: (e) =>
      setIncrMsg({ kind: "err", text: humanizeError((e as Error).message) }),
  });

  const fullMut = useMutation({
    mutationFn: () =>
      triggerFullSync({
        days,
        skip_documents: skipDocs,
        skip_stock_snapshot: skipStock,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sync-tasks"] });
      qc.invalidateQueries({ queryKey: ["sync-log"] });
    },
  });

  // ── Estadísticas resumen ──
  const stats = useMemo(() => {
    const rows = log.data ?? [];
    let okCount = 0;
    let errCount = 0;
    let runCount = 0;
    let last: string | null = null;
    let lastMs = 0;
    for (const r of rows) {
      if (/ok|success/i.test(r.status)) okCount++;
      else if (/running/i.test(r.status)) runCount++;
      else if (/error|fail/i.test(r.status)) errCount++;
      const t = parseTs(r.started_at) ?? 0;
      if (t > lastMs) {
        lastMs = t;
        last = r.started_at;
      }
    }
    return { okCount, errCount, runCount, last };
  }, [log.data]);

  return {
    days,
    setDays,
    skipDocs,
    setSkipDocs,
    skipStock,
    setSkipStock,
    incrMsg,
    tasks,
    activeTask,
    log,
    hasActiveRun,
    dq,
    incrMut,
    fullMut,
    stats,
  };
}
