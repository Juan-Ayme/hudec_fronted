"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Store, Check, ChevronDown, RotateCw } from "lucide-react";
import { getStockValuation, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCompany } from "./company-context";

/* ────────────────────────────────────────────────────────────
 * Selector global de sucursal para la sección Análisis.
 *
 * Estado central: { officeId, sucursalName } | null  (null = todas las tiendas).
 * Persistido en localStorage para sobrevivir a recargas y a cambios de página.
 * Los endpoints analíticos del backend aceptan `office_id` opcional y los
 * componentes del frontend leen `useSucursal()` para filtrar consistentemente.
 * ──────────────────────────────────────────────────────────── */

export interface SucursalSelection {
  officeId: number;
  sucursalName: string;
}

interface SucursalCtx {
  officeId: number | null;
  sucursalName: string | null;
  setSucursal: (s: SucursalSelection | null) => void;
}

const Ctx = createContext<SucursalCtx | null>(null);
const STORAGE_KEY = "kawii.sucursal";

function loadFromStorage(): SucursalSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SucursalSelection>;
    if (
      typeof parsed?.officeId === "number" &&
      typeof parsed?.sucursalName === "string"
    ) {
      return { officeId: parsed.officeId, sucursalName: parsed.sucursalName };
    }
  } catch {
    /* corrupto: ignoramos */
  }
  return null;
}

export function SucursalProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: lee localStorage en el primer render del cliente.
  // En SSR `loadFromStorage()` devuelve null (guard de `typeof window`).
  const [state, setState] = useState<SucursalSelection | null>(loadFromStorage);

  // Persistir cualquier cambio posterior. No depende de hidratación: el
  // initializer ya cargó el valor real en cliente.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  const value: SucursalCtx = {
    officeId: state?.officeId ?? null,
    sucursalName: state?.sucursalName ?? null,
    setSucursal: setState,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSucursal(): SucursalCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useSucursal debe usarse dentro de <SucursalProvider>");
  }
  return ctx;
}

/* ──────────────────────── SELECTOR UI ─────────────────────── */

export function SucursalSelector() {
  const { officeId, sucursalName, setSucursal } = useSucursal();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const valuation = useQuery({
    queryKey: ["stock-valuation"],
    queryFn: ({ signal }) => getStockValuation(signal),
    staleTime: 10 * 60_000,
    // ★ Robustez: 2 retries con backoff exponencial. Cubre el caso típico
    //   de reinicios cortos del backend (ej. uvicorn --reload picking up
    //   un cambio de SQL/Python). Sin retry, el error queda "pegado" hasta
    //   la próxima recarga manual de página.
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 4000),
  });

  // Acceso por sucursal: si la empresa activa tiene sucursales permitidas,
  // el selector solo ofrece esas y nunca "Todas las tiendas".
  const { activeCompany } = useCompany();
  const allowed = activeCompany?.allowed_office_ids ?? [];
  const restricted = allowed.length > 0;

  const sucursales = valuation.data?.por_sucursal ?? [];
  const visibleSucursales = restricted
    ? sucursales.filter((s) => allowed.includes(s.bsale_office_id))
    : sucursales;

  // Con acceso restringido, forzar la selección a una sucursal permitida
  // (nunca "Todas"). Con una sola permitida, queda fija.
  useEffect(() => {
    if (!restricted || visibleSucursales.length === 0) return;
    const currentOk = officeId != null && allowed.includes(officeId);
    if (!currentOk) {
      const first = visibleSucursales[0];
      setSucursal({ officeId: first.bsale_office_id, sucursalName: first.sucursal });
    }
  }, [restricted, visibleSucursales, officeId, allowed, setSucursal]);

  const label = sucursalName ?? "Todas las tiendas";
  const isActive = officeId !== null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1.5 rounded-md border border-border-soft bg-surface-2 px-3 py-1.5 text-caption font-medium text-fg shadow-sm",
          "transition-[background,color,border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-premium)]",
          "hover:bg-surface-3 hover:border-border",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          open && "bg-surface-3 border-border",
          isActive && "border-primary/30"
        )}
        title={isActive ? `Filtro activo: ${label}` : "Filtrar todas las páginas por sucursal"}
      >
        <Store className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted")} aria-hidden="true" />
        <span className="truncate max-w-[200px] font-semibold">{label}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted transition-transform duration-[var(--duration-fast)]",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
            className={cn(
              "absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-lg border border-border-soft bg-surface shadow-popover",
              "animate-[scale-in_var(--duration-base)_var(--ease-premium)_both] origin-top-right",
            )}
          >
            {!restricted && (
              <>
                <button
                  role="option"
                  aria-selected={officeId === null}
                  onClick={() => {
                    setSucursal(null);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors",
                    officeId === null
                      ? "bg-primary/10 text-primary"
                      : "text-slate-300 hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <span className="font-medium">Todas las tiendas</span>
                  {officeId === null && <Check className="h-3.5 w-3.5" />}
                </button>
                <div className="border-t border-border/40" />
              </>
            )}
            {valuation.isLoading ? (
              <div className="px-3 py-2 text-[11px] text-faint">Cargando…</div>
            ) : valuation.isError ? (
              <div className="px-3 py-2.5 text-[11px]">
                <div className="flex items-start gap-2 text-danger">
                  <span className="font-medium">Error al cargar sucursales</span>
                </div>
                <p className="mt-1 break-words text-faint">
                  {valuation.error instanceof ApiError
                    ? valuation.error.message
                    : "Error de red"}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    valuation.refetch();
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded border border-border bg-surface-2 px-2 py-1 text-[11px] font-medium text-fg hover:bg-surface-3"
                >
                  <RotateCw className={cn("h-3 w-3", valuation.isFetching && "animate-spin")} />
                  Reintentar
                </button>
              </div>
            ) : visibleSucursales.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-faint">
                Sin sucursales
              </div>
            ) : (
              visibleSucursales.map((s) => {
                const selected = officeId === s.bsale_office_id;
                return (
                  <button
                    key={s.bsale_office_id}
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setSucursal({
                        officeId: s.bsale_office_id,
                        sucursalName: s.sucursal,
                      });
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors",
                      selected
                        ? "bg-primary/10 text-primary"
                        : "text-slate-300 hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    <span className="truncate font-medium">{s.sucursal}</span>
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })
            )}
          </div>
      )}
    </div>
  );
}
