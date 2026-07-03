"use client";

import { useState, useRef, useEffect } from "react";
import { Snowflake, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Exclusiones } from "@/lib/bi-types";

/**
 * Chip-popover chico que muestra las categorías/deptos marcados como estacionales.
 * Aclara al usuario por qué "recurrente" difiere de "total". Se coloca al lado
 * del título de cualquier página BI.
 *
 * Si no hay exclusiones (ninguna categoría estacional) NO renderiza — no vale
 * la pena distraer al usuario con un chip vacío.
 */
export function EstacionalesInfo({
  exclusiones,
  className,
}: {
  exclusiones: Exclusiones;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const total = exclusiones.departamentos.length + exclusiones.categorias.length;

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  if (total === 0) return null;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-info/25 bg-info/8 px-2.5 py-1",
          "text-caption font-semibold text-info",
          "transition-colors hover:bg-info/15 hover:border-info/50",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Ver categorías estacionales"
      >
        <Snowflake className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{total} estacional{total === 1 ? "" : "es"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          className={cn(
            "absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-lg border border-border-soft bg-surface shadow-popover",
            "animate-[scale-in_var(--duration-base)_var(--ease-premium)_both] origin-top-right",
          )}
        >
          <div className="flex items-center justify-between border-b border-border-soft px-3 py-2">
            <p className="text-caption font-semibold uppercase tracking-wider text-muted">
              Fuera del cálculo recurrente
            </p>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-faint hover:bg-surface-2 hover:text-fg"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {exclusiones.departamentos.length > 0 && (
              <section>
                <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-faint">
                  Departamentos
                </p>
                <ul className="space-y-0.5">
                  {exclusiones.departamentos.map((d) => (
                    <li key={d} className="text-caption text-fg">
                      • {d}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {exclusiones.categorias.length > 0 && (
              <section>
                <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-faint">
                  Categorías
                </p>
                <ul className="space-y-0.5">
                  {exclusiones.categorias.map((c) => (
                    <li key={c} className="text-caption text-fg">
                      • {c}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {exclusiones.nota && (
              <p className="mt-2 border-t border-border-soft pt-2 text-[0.65rem] italic text-faint">
                {exclusiones.nota}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
