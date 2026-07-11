"use client";

import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditResponse } from "@/lib/types";
import { SEVERITY } from "../lib";

export function SeverityBanner({
  severity,
  generatedAt,
}: {
  severity: AuditResponse["severity"];
  generatedAt: string;
}) {
  const sev = SEVERITY[severity];
  if (!sev) return null;
  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-3 rounded-xl border px-4 py-3",
        sev.cls,
      )}
    >
      <sev.icon className={cn("h-6 w-6", sev.iconCls)} />
      <div>
        <p className="text-sm font-semibold text-fg">{sev.label}</p>
        <p className="text-xs text-muted">
          Generado: {dateTime(generatedAt)}
        </p>
      </div>
    </div>
  );
}
