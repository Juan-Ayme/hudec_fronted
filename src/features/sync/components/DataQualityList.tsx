"use client";

import { CheckCircle2 } from "lucide-react";
import { dateTime } from "@/lib/format";
import { entityInfo, humanizeError } from "@/lib/sync-i18n";
import { Badge } from "@/components/ui/badge";

export function DataQualityList({
  issues,
  loading,
  error,
}: {
  issues: { id: number; entity: string; issue_type: string; field: string | null; description: string | null; created_at: string }[];
  loading: boolean;
  error: unknown;
}) {
  if (loading) {
    return <p className="text-caption text-muted">Cargando…</p>;
  }
  if (error) {
    return (
      <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-caption text-danger">
        {humanizeError((error as Error).message)}
      </p>
    );
  }
  if (!issues.length) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-md border border-dashed border-success/30 bg-success/5 px-4 py-6 text-center">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <div>
          <p className="text-sm font-semibold text-fg">
            Sin incidencias de calidad
          </p>
          <p className="text-caption text-muted">
            BSale entregó datos limpios en la última sincronización.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
      {issues.slice(0, 30).map((i) => {
        const ent = entityInfo(i.entity);
        return (
          <div
            key={i.id}
            className="rounded-lg border border-warning/25 bg-warning-dim/30 px-3 py-2"
          >
            <div className="flex items-start gap-2">
              <span className="text-xl" aria-hidden>
                {ent.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-fg">
                    {ent.label}
                  </span>
                  <Badge tone="warning">{i.issue_type}</Badge>
                  {i.field && (
                    <span className="font-mono text-[10px] text-faint">
                      campo: {i.field}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-caption text-muted">
                  {i.description ?? "Sin descripción del backend."}
                </p>
                <p className="mt-1 text-[10px] text-faint">
                  Detectado {dateTime(i.created_at)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
