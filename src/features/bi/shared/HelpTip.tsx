"use client";

import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Icono "?" con tooltip accesible (hover + focus) para explicar términos de
 * negocio en lenguaje de gerente, sin ensuciar el layout.
 *
 * Usarlo en headers de cards y labels de KPIs. En headers de tablas con
 * scroll interno (overflow) usar `title` nativo en el <th> — este tooltip
 * quedaría recortado por el contenedor.
 */
export function HelpTip({
  text,
  className,
  side = "top",
}: {
  text: string;
  className?: string;
  side?: "top" | "bottom";
}) {
  return (
    <span className={cn("group relative inline-flex align-middle", className)}>
      <button
        type="button"
        aria-label={`Ayuda: ${text}`}
        className="cursor-help rounded-full text-faint transition-colors hover:text-info focus:text-info focus:outline-none"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-64 max-w-[70vw] -translate-x-1/2 rounded-md border border-border-soft bg-surface-3 px-2.5 py-1.5",
          "whitespace-normal text-left text-[0.7rem] font-normal normal-case tracking-normal leading-snug text-fg shadow-popover",
          "opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
        )}
      >
        {text}
      </span>
    </span>
  );
}
