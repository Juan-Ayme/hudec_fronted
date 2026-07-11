"use client";

import { dateTime } from "@/lib/format";
import { describeTaskParams, humanizeError, statusInfo } from "@/lib/sync-i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SyncTask } from "@/lib/types";
import { StopButton } from "./StopButton";

export function TaskList({
  tasks,
  loading,
}: {
  tasks: SyncTask[];
  loading: boolean;
}) {
  if (loading && !tasks.length) {
    return (
      <div className="rounded-md border border-dashed border-border-soft py-6 text-center text-caption text-muted">
        Cargando…
      </div>
    );
  }
  if (!tasks.length) {
    return (
      <div className="rounded-md border border-dashed border-border-soft py-6 text-center">
        <p className="text-sm font-medium text-fg">Sin tareas todavía</p>
        <p className="mt-1 text-caption text-muted">
          Dispara una sync incremental o completa para empezar.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {tasks.slice(0, 12).map((t) => {
        const st = statusInfo(t.status);
        const isLive = t.status === "RUNNING" || t.status === "QUEUED";
        return (
          <div
            key={t.task_id}
            className={cn(
              "rounded-lg border bg-surface-2/40 px-3 py-2 text-caption",
              isLive ? "border-info/30 ring-1 ring-info/20" : "border-border-soft",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={st.tone} dot={isLive}>
                {st.label}
              </Badge>
              <span className="font-mono text-faint">{t.task_id}</span>
              {isLive && <StopButton taskId={t.task_id} />}
              {t.returncode != null && t.returncode !== 0 && (
                <Badge tone="danger">exit {t.returncode}</Badge>
              )}
            </div>
            <p className="mt-1 text-muted">{describeTaskParams(t.params)}</p>
            <p className="mt-1 text-faint">
              {t.started_at ? (
                <>Inició {dateTime(t.started_at)}</>
              ) : t.created_at ? (
                <>Encolada {dateTime(t.created_at)}</>
              ) : null}
              {t.finished_at && ` · Terminó ${dateTime(t.finished_at)}`}
            </p>
            {t.error && (
              <p className="mt-1 rounded border border-danger/30 bg-danger/10 px-2 py-1 text-danger">
                {humanizeError(t.error)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
