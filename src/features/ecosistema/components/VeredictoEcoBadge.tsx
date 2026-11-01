"use client";

import { Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EcosistemaVeredicto } from "@/lib/bi-types";
import { VEREDICTO_ECO } from "./veredicto-eco";

/** Badge coloreado por veredicto del ecosistema, con tooltip explicativo. */
export function VeredictoEcoBadge({
  codigo,
  showIcon = true,
  className,
}: {
  codigo: EcosistemaVeredicto;
  showIcon?: boolean;
  className?: string;
}) {
  // Fallback neutro si el backend agrega un código nuevo — no crashear.
  const meta = VEREDICTO_ECO[codigo] ?? {
    tone: "neutral" as const,
    label: String(codigo).toLowerCase().replaceAll("_", " "),
    icon: Circle,
    desc: "",
  };
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} title={meta.desc} className={cn("cursor-help gap-1", className)}>
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {meta.label}
    </Badge>
  );
}
