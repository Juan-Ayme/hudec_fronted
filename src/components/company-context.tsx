"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useAuth } from "./auth-context";
import { cn } from "@/lib/utils";
import type { Company, UserRole } from "@/lib/api";

/* ────────────────────────────────────────────────────────────
 * Selector global de EMPRESA (multi-tenant).
 *
 * Un usuario puede pertenecer a varias empresas. Esta pieza:
 *   - Elige cuál es la empresa activa (o la primera si nunca se eligió).
 *   - Persiste la elección en localStorage.
 *   - Expone `activeCompany`, `activeRole` y `setActiveCompany`.
 *   - Renderiza un dropdown en el header.
 *
 * El header `X-Company-Id` que va en cada request lo inyecta el cliente
 * HTTP (src/lib/api.ts) leyendo esta selección — ver sub-paso 5.3.
 *
 * Nota: esto es DISTINTO del SucursalContext, que filtra por sucursal
 * DENTRO de la empresa activa. Jerarquía: Empresa → Sucursal.
 * ──────────────────────────────────────────────────────────── */

interface CompanyCtx {
  activeCompanyId: number | null;
  activeCompany: Company | null;
  activeRole: UserRole | null;
  setActiveCompany: (companyId: number) => void;
}

const Ctx = createContext<CompanyCtx | null>(null);
const STORAGE_KEY = "kawii.company";

function loadFromStorage(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/** Leído por el cliente HTTP para inyectar `X-Company-Id` en cada request.
 * No es un hook: puede llamarse fuera de React (dentro de `request()`). */
export function getActiveCompanyId(): number | null {
  if (typeof window === "undefined") return null;
  return loadFromStorage();
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { companies } = useAuth();
  const [storedId, setStoredId] = useState<number | null>(loadFromStorage);

  // Sync a localStorage cuando cambia la selección.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (storedId !== null) {
      window.localStorage.setItem(STORAGE_KEY, String(storedId));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [storedId]);

  // Auto-selección SOLO si el user tiene UNA sola empresa. Con 2+ el user
  // decide explícitamente en /select-company. Si la guardada ya no está en
  // sus membresías (ej. le sacaron acceso), limpiamos la selección para
  // forzar re-elección.
  useEffect(() => {
    if (!companies.length) return;
    const stillValid =
      storedId !== null && companies.some((c) => c.id === storedId);
    if (!stillValid) {
      if (companies.length === 1) {
        setStoredId(companies[0].id);
      } else if (storedId !== null) {
        // Tenía una empresa guardada pero ya no está en sus membresías → limpiar
        setStoredId(null);
      }
    }
  }, [companies, storedId]);

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === storedId) ?? null,
    [companies, storedId],
  );

  const value: CompanyCtx = {
    activeCompanyId: activeCompany?.id ?? null,
    activeCompany,
    activeRole: activeCompany?.role ?? null,
    setActiveCompany: setStoredId,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompany(): CompanyCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCompany debe usarse dentro de <CompanyProvider>");
  return ctx;
}

/** Guard: falla si el user no tiene el rol requerido EN LA EMPRESA ACTIVA. */
export function useRequireCompanyRole(roles: UserRole[]): boolean {
  const { activeRole } = useCompany();
  return activeRole !== null && roles.includes(activeRole);
}

/* ──────────────────────── SELECTOR UI ─────────────────────── */

export function CompanySelector() {
  const { companies } = useAuth();
  const { activeCompanyId, setActiveCompany } = useCompany();
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

  // Si el user pertenece a una sola empresa, no mostramos el selector
  if (companies.length <= 1) return null;

  const active = companies.find((c) => c.id === activeCompanyId);
  const label = active?.name ?? "Elegir empresa";

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
          open && "bg-surface-3 border-border"
        )}
        title={`Cambiar de empresa: ${label}`}
      >
        <Building2 className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
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
              "absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-lg border border-border-soft bg-surface shadow-popover",
              "animate-[scale-in_var(--duration-base)_var(--ease-premium)_both] origin-top-right",
            )}
          >
            {companies.map((c) => {
              const selected = c.id === activeCompanyId;
              return (
                <button
                  key={c.id}
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setActiveCompany(c.id);
                    setOpen(false);
                    // La cache de React Query queda con datos de la empresa
                    // anterior. Al cambiar, hay que refetchear todo.
                    if (typeof window !== "undefined") {
                      window.location.reload();
                    }
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors",
                    selected
                      ? "bg-primary/10 text-primary"
                      : "text-slate-300 hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <div className="flex flex-col">
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-70">
                      {c.role}
                    </span>
                  </div>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
      )}
    </div>
  );
}
