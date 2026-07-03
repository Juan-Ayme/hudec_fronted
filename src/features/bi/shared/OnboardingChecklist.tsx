"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleAlert,
  Rocket,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardBody } from "@/components/ui/card";
import { getPulse, getCatalogHealth, getVariantCostsAudit, biQueryKeys } from "@/lib/bi-api";
import { useSucursal } from "@/components/sucursal-context";
import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";

/**
 * Checklist de bienvenida que se muestra arriba de /pulso mientras la empresa
 * está en onboarding. Consulta los 3 endpoints livianos para saber:
 *   1. Sync corrió (venta > 0)
 *   2. Metas del mes cargadas
 *   3. Category targets cargados
 *   4. Cobertura de costos ≥ 90%
 *
 * Cuando todos están OK, el user puede cerrarlo y se guarda en localStorage.
 * Se auto-oculta si ya estaba dismissed y todo está OK.
 */
const DISMISS_KEY = "kawii.bi.onboarding_dismissed";

function loadDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

function saveDismissed(v: boolean) {
  if (typeof window === "undefined") return;
  if (v) window.localStorage.setItem(DISMISS_KEY, "1");
  else window.localStorage.removeItem(DISMISS_KEY);
}

export function OnboardingChecklist() {
  const { user } = useAuth();
  const { officeId } = useSucursal();
  const [dismissed, setDismissed] = useState<boolean>(loadDismissed);
  const [expanded, setExpanded] = useState(true);

  const pulse = useQuery({
    queryKey: biQueryKeys.pulse(officeId),
    queryFn: ({ signal }) => getPulse(officeId, signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const catalog = useQuery({
    queryKey: biQueryKeys.catalogHealth(officeId, 5),
    queryFn: ({ signal }) => getCatalogHealth({ office_id: officeId, top_n: 5 }, signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const audit = useQuery({
    queryKey: biQueryKeys.variantCostsAudit(),
    queryFn: ({ signal }) => getVariantCostsAudit(signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // Loading: no montamos nada — evitamos flash de checklist antes de saber si el user ya terminó todo.
  if (pulse.isLoading || catalog.isLoading || audit.isLoading) return null;

  const hasVentas = (pulse.data?.mes_en_curso.global.venta_acumulada ?? 0) > 0;
  const hasMeta = (pulse.data?.mes_en_curso.global.meta ?? 0) > 0;
  const hasTargets = catalog.data?.bloque_estable_80_20 !== null;
  const coberturaOk =
    (audit.data?.ventas_ultimos_90d.cobertura_costos_pct ?? 0) >= 90;

  const steps = [
    {
      id: "sync",
      label: "Datos sincronizados",
      done: hasVentas,
      href: "/sync",
      hint: hasVentas
        ? undefined
        : "Aún no hay ventas registradas. Correr el primer sync.",
    },
    {
      id: "meta",
      label: "Meta del mes cargada",
      done: hasMeta,
      href: "/configuracion?tab=goals",
      hint: hasMeta ? undefined : "Definir la meta mensual por sucursal.",
    },
    {
      id: "targets",
      label: "Category targets (80/20)",
      done: hasTargets,
      href: "/salud-catalogo",
      hint: hasTargets ? undefined : "Correr el bootstrap desde /salud-catalogo.",
    },
    {
      id: "costos",
      label: "Cobertura de costos ≥ 90%",
      done: coberturaOk,
      href: "/configuracion?tab=costos",
      hint: coberturaOk
        ? undefined
        : "Auditar y recuperar costos faltantes desde recepciones.",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  // Si el user cerró el checklist y todo está OK, no volvemos a mostrarlo.
  if (dismissed && allDone) return null;

  return (
    <Card
      className={cn(
        "border-l-4",
        allDone ? "border-l-success/70 bg-success/6" : "border-l-info/70 bg-info/6",
      )}
    >
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              allDone ? "bg-success/20 text-success" : "bg-info/20 text-info",
            )}
          >
            {allDone ? (
              <Check className="h-5 w-5" aria-hidden="true" strokeWidth={2.5} />
            ) : (
              <Rocket className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body font-bold text-fg">
              {allDone ? "¡Setup completo!" : `Configuración de arranque (${doneCount}/${steps.length})`}
            </p>
            <p className="text-caption text-muted">
              {allDone
                ? `Todo listo, ${user?.username ?? "admin"}. El dashboard tiene datos válidos.`
                : "Completá estos pasos para que las 4 vistas del dashboard tengan datos completos."}
            </p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label={expanded ? "Colapsar" : "Expandir"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {allDone && (
            <button
              onClick={() => {
                setDismissed(true);
                saveDismissed(true);
              }}
              className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Cerrar checklist"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {expanded && (
          <ul className="flex flex-col gap-2 border-t border-border-soft pt-3">
            {steps.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-md px-2 py-1.5"
              >
                <div className="flex min-w-0 items-start gap-2">
                  {s.done ? (
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted">
                      <Circle className="h-2 w-2" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-caption font-semibold",
                        s.done ? "text-success line-through decoration-1 opacity-70" : "text-fg",
                      )}
                    >
                      {s.label}
                    </p>
                    {s.hint && (
                      <p className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-muted">
                        <CircleAlert className="h-3 w-3 text-warning" aria-hidden="true" />
                        {s.hint}
                      </p>
                    )}
                  </div>
                </div>
                {!s.done && (
                  <Link
                    href={s.href}
                    className="shrink-0 rounded-md border border-info/40 bg-info/10 px-2.5 py-1 text-caption font-semibold text-info transition-colors hover:bg-info/20"
                  >
                    Ir
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
