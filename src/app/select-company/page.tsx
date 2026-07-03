"use client";

/**
 * Página intermedia entre login y dashboard.
 *
 * Solo aparece cuando el user tiene 2+ empresas. Con 1 sola, el AuthContext
 * / CompanyContext auto-seleccionan y el user va directo al dashboard.
 *
 * Es también el destino del botón "Cambiar empresa" en el UserMenu.
 */

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, LogOut, Shield, User, Eye } from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { useCompany } from "@/components/company-context";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/api";

const roleIcon: Record<UserRole, typeof Shield> = {
  admin: Shield,
  operador: User,
  viewer: Eye,
};

const roleColor: Record<UserRole, string> = {
  admin: "text-primary",
  operador: "text-violet",
  viewer: "text-success",
};

function SelectCompanyView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const { user, companies, isLoading, isAuthenticated, signOut } = useAuth();
  const { setActiveCompany } = useCompany();

  // Si no hay sesión → login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent("/select-company")}`);
    }
  }, [isLoading, isAuthenticated, router]);

  // Si el user tiene 1 sola empresa, no debería estar acá. Redirigir.
  useEffect(() => {
    if (!isLoading && isAuthenticated && companies.length === 1) {
      setActiveCompany(companies[0].id);
      router.replace(next);
    }
  }, [isLoading, isAuthenticated, companies, next, router, setActiveCompany]);

  const handleSelect = (companyId: number) => {
    setActiveCompany(companyId);
    // Reload para que React Query invalide todo con el nuevo header
    window.location.href = next;
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  if (isLoading || !user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-bg">
        <div className="animate-pulse text-muted font-medium text-sm">Cargando…</div>
      </main>
    );
  }

  if (companies.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 bg-bg">
        <div className="border border-border rounded-lg p-6 md:p-8 max-w-md w-full mx-auto shadow-sm bg-surface text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
            <Building2 className="h-7 w-7 text-danger" />
          </div>
          <h1 className="text-fg text-2xl font-bold mb-3">Sin empresas</h1>
          <p className="text-muted text-sm leading-relaxed mb-6">
            Tu usuario <strong className="text-fg font-semibold">{user.username}</strong> no tiene acceso a
            ninguna empresa. Pedí al admin que te agregue como miembro.
          </p>
          <Button
            onClick={handleLogout}
            className="w-full justify-center bg-surface-3 hover:bg-surface-4 text-fg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <div className="py-4 px-4 md:px-8 w-full">
        <div className="grid items-center gap-6 max-w-6xl w-full mx-auto lg:grid-cols-2">
          
          <div className="border border-border rounded-lg p-6 md:p-8 max-w-md mx-auto shadow-sm lg:mx-0 bg-surface w-full">
            <div className="mb-8">
              <h1 className="text-fg text-3xl font-bold mb-4">
                Elegí tu empresa
              </h1>
              <p className="text-muted text-base leading-relaxed">
                Hola <strong className="text-fg font-semibold">{user.username}</strong>, tenés acceso a {companies.length} empresa{companies.length !== 1 ? 's' : ''}. Seleccioná una para continuar.
              </p>
            </div>

            <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-1">
              {companies.map((c) => {
                const Icon = roleIcon[c.role];
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={cn(
                      "w-full group relative flex flex-col items-start gap-3 rounded-xl border border-border-soft bg-surface-2 p-4 text-left",
                      "transition-all duration-200 ease-in-out",
                      "hover:border-primary/50 hover:bg-surface-3 hover:shadow-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-fg group-hover:text-primary transition-colors">
                            {c.name}
                          </p>
                          <p className="text-xs text-faint mt-0.5">{c.slug}</p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide",
                          c.role === 'admin' ? 'bg-primary/10 text-primary' : 
                          c.role === 'operador' ? 'bg-violet/10 text-violet' : 
                          'bg-success/10 text-success'
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {c.role}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-border-soft">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-muted hover:text-fg justify-center transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>

          <div className="aspect-[71/50] max-lg:w-4/5 mx-auto flex items-center justify-center p-6 bg-surface-2 rounded-2xl border border-border-soft shadow-sm">
            <svg
              className="w-full h-auto text-primary"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Companies Network Illustration"
              role="img"
            >
              {/* Central Hub */}
              <circle cx="200" cy="150" r="40" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15"/>
              <rect x="185" y="135" width="30" height="30" rx="6" fill="currentColor" />
              <path d="M192 158V142H208V158M196 142V158M204 142V158" stroke="white" strokeWidth="1.5" strokeOpacity="0.9" strokeLinecap="round"/>

              {/* Connecting Lines */}
              <path d="M200 110 L200 70 M230 130 L280 90 M230 170 L280 210 M200 190 L200 230 M170 170 L120 210 M170 130 L120 90" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M200 110 L200 70 M230 130 L280 90" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" className="animate-pulse"/>

              {/* Node 1 (Top) */}
              <circle cx="200" cy="70" r="25" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15"/>
              <rect x="190" y="60" width="20" height="20" rx="4" fill="currentColor" className="text-indigo-400" />
              
              {/* Node 2 (Top Right) */}
              <circle cx="280" cy="90" r="25" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15"/>
              <rect x="270" y="80" width="20" height="20" rx="4" fill="currentColor" className="text-accent" />
              
              {/* Node 3 (Bottom Right) */}
              <circle cx="280" cy="210" r="25" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15"/>
              <rect x="270" y="200" width="20" height="20" rx="4" fill="currentColor" className="text-violet" />
              
              {/* Node 4 (Bottom) */}
              <circle cx="200" cy="230" r="25" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15"/>
              <rect x="190" y="220" width="20" height="20" rx="4" fill="currentColor" className="text-warning" />
              
              {/* Node 5 (Bottom Left) */}
              <circle cx="120" cy="210" r="25" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15"/>
              <rect x="110" y="200" width="20" height="20" rx="4" fill="currentColor" className="text-danger" />
              
              {/* Node 6 (Top Left) */}
              <circle cx="120" cy="90" r="25" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15"/>
              <rect x="110" y="80" width="20" height="20" rx="4" fill="currentColor" className="text-info" />
              
              {/* Floating UI elements */}
              <rect x="270" y="50" width="60" height="12" rx="6" fill="currentColor" fillOpacity="0.06" />
              <rect x="270" y="170" width="40" height="12" rx="6" fill="currentColor" fillOpacity="0.06" />
              <rect x="70" y="170" width="50" height="12" rx="6" fill="currentColor" fillOpacity="0.06" />
            </svg>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SelectCompanyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted">
          Cargando…
        </div>
      }
    >
      <SelectCompanyView />
    </Suspense>
  );
}
