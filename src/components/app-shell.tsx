"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, ChevronLeft, ChevronRight, LogOut, Menu, ShieldCheck, X, Check, Store, RotateCw, ChevronDown } from "lucide-react";
import { NAV_GROUPS, ALL_NAV_ITEMS } from "./nav";
import { ApiStatus } from "./api-status";
import { useSucursal } from "./sucursal-context";
import { useCompany } from "./company-context";
import { Toaster } from "./ui/toaster";
import { useAuth } from "./auth-context";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getStockValuation, ApiError } from "@/lib/api";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Por defecto expandir el grupo que contiene la ruta actual
    for (const g of NAV_GROUPS) {
      if (g.items.some(i => isActive(pathname, i.href))) {
        initial.add(g.title);
      }
    }
    // Si no hay ninguno activo, expandimos el primero
    if (initial.size === 0 && NAV_GROUPS.length > 0) {
      initial.add(NAV_GROUPS[0].title);
    }
    return initial;
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <nav className={cn("flex flex-col", collapsed ? "gap-2" : "gap-3")}>
      {NAV_GROUPS.map((group) => {
        const isExpanded = expandedGroups.has(group.title);
        
        if (collapsed) {
          if (!isExpanded) return null;
          return (
            <ul key={group.title} className="flex flex-col gap-1 mb-2">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      className={cn(
                        "group relative flex items-center justify-center rounded-xl p-2.5 text-body font-medium",
                        "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95]",
                        active ? "bg-primary/15 text-primary shadow-sm" : "text-muted hover:bg-surface-2/60 hover:text-fg"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors duration-300",
                          active ? "text-primary" : "text-faint group-hover:text-muted"
                        )}
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Modo expandido
        return (
          <div key={group.title} className="flex flex-col mb-1">
            <button
              onClick={() => toggleGroup(group.title)}
              className="flex w-full items-center justify-between px-3 py-2 text-left transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-2/40 rounded-xl group/header active:scale-[0.98]"
              title={isExpanded ? "Contraer grupo" : "Expandir grupo"}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted/70 group-hover/header:text-muted transition-colors">
                {group.title}
              </span>
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-muted/50 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/header:text-muted",
                  isExpanded ? "rotate-90" : ""
                )}
              />
            </button>
            
            <div
              className={cn(
                "grid transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isExpanded ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0 mt-0"
              )}
            >
              <ul className="flex flex-col gap-0.5 overflow-hidden">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium mx-1",
                          "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]",
                          active ? "bg-primary/15 text-primary shadow-sm" : "text-muted hover:bg-surface-2/60 hover:text-fg"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors duration-300",
                            active ? "text-primary" : "text-faint group-hover:text-muted"
                          )}
                          aria-hidden="true"
                        />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  const { activeCompany } = useCompany();
  const companyName = activeCompany?.name ?? "Grupo Hudec";
  const initial = companyName.charAt(0).toUpperCase() || "K";

  return (
    <div
      className={cn(
        "flex items-center",
        collapsed ? "justify-center" : "gap-2.5",
      )}
      title={collapsed ? `KAWII BI · ${companyName}` : undefined}
    >
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent font-bold text-primary-fg shadow-card-hover">
        <span className="relative z-10">{initial}</span>
        <span
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/15 to-transparent"
          aria-hidden="true"
        />
      </div>
      {!collapsed && (
        <div className="leading-tight overflow-hidden">
          <p className="text-h3 font-semibold text-fg truncate" title={companyName}>{companyName}</p>
          <p className="text-caption tracking-normal text-faint truncate">Business Intelligence</p>
        </div>
      )}
    </div>
  );
}

function UnifiedHeaderMenu() {
  const { user, companies, signOut } = useAuth();
  const { activeCompanyId, setActiveCompany, activeRole } = useCompany();
  const { officeId, setSucursal } = useSucursal();
  const router = useRouter();
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
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 4000),
  });

  const sucursales = valuation.data?.por_sucursal ?? [];

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const roleStyle: Record<string, string> = {
    admin: "bg-primary text-primary-fg font-semibold shadow-sm",
    operador: "bg-success text-success-fg font-semibold shadow-sm",
    viewer: "bg-surface-3 text-fg border border-border-soft font-semibold",
  };

  const displayRole = activeRole ?? companies[0]?.role ?? "viewer";

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex items-center gap-3 rounded-[20px] border border-border/40 bg-surface-2/60 backdrop-blur-md pl-2 pr-3 py-1.5 text-sm font-medium text-fg shadow-sm",
          "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95]",
          "hover:bg-surface-3/80 hover:border-border/60 hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          open && "bg-surface-3/90 border-border/80 shadow-inner scale-[0.98]"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold uppercase shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] border border-primary/20">
            {user.username.slice(0, 2)}
          </span>
          <span className="hidden flex-col items-start leading-tight sm:flex">
            <span>{user.username}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.62rem] uppercase tracking-wider",
                roleStyle[displayRole] ?? "",
              )}
            >
              {displayRole}
            </span>
          </span>
        </div>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-muted/70 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:text-fg",
            open && "rotate-180 text-fg"
          )} 
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 max-h-[85vh] overflow-y-auto rounded-xl border border-border-soft bg-surface/95 backdrop-blur-xl shadow-2xl animate-[scale-in_var(--duration-fast)_var(--ease-out)_both] origin-top-right p-1.5 flex flex-col">
          
          {/* Header del Menú */}
          <div className="px-3 py-2.5 mb-1 flex flex-col gap-0.5">
            <p className="font-semibold text-fg leading-tight">{user.username}</p>
            <p className="text-xs text-muted leading-tight">{displayRole}</p>
          </div>

          <div className="h-px bg-border/40 mx-2 my-1" />

          {/* Sección de Empresas */}
          {companies.length > 1 && (
            <div className="flex flex-col gap-0.5 py-1">
              <div className="px-3 pb-1 pt-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted/70 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Empresas
                </p>
              </div>
              {companies.map((c) => {
                const selected = c.id === activeCompanyId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveCompany(c.id);
                      setOpen(false);
                      if (typeof window !== "undefined") {
                        window.location.reload();
                      }
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200 active:scale-[0.98]",
                      selected ? "bg-primary/15 text-primary font-medium" : "hover:bg-surface-2 text-fg"
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="leading-none">{c.name}</span>
                      <span className="text-[10px] uppercase opacity-60 leading-none">{c.role}</span>
                    </div>
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}

          {companies.length > 1 && <div className="h-px bg-border/40 mx-2 my-1" />}

          {/* Sección de Sucursales */}
          <div className="flex flex-col gap-0.5 py-1">
            <div className="px-3 pb-1 pt-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted/70 flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" /> Sucursales
              </p>
            </div>
            
            <button
              onClick={() => {
                setSucursal(null);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200 active:scale-[0.98]",
                officeId === null ? "bg-primary/15 text-primary font-medium" : "hover:bg-surface-2 text-fg"
              )}
            >
              <span className="leading-none">Todas las tiendas</span>
              {officeId === null && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>

            {valuation.isLoading ? (
              <div className="px-3 py-3 text-xs text-muted flex items-center gap-2">
                <RotateCw className="h-3.5 w-3.5 animate-spin" /> Cargando tiendas...
              </div>
            ) : valuation.isError ? (
              <div className="px-3 py-3 text-xs text-danger flex items-center gap-2">
                <RotateCw className="h-3.5 w-3.5" /> Error al cargar
              </div>
            ) : (
              sucursales.map((s) => {
                const selected = officeId === s.bsale_office_id;
                return (
                  <button
                    key={s.bsale_office_id}
                    onClick={() => {
                      setSucursal({ officeId: s.bsale_office_id, sucursalName: s.sucursal });
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200 active:scale-[0.98]",
                      selected ? "bg-primary/15 text-primary font-medium" : "hover:bg-surface-2 text-fg"
                    )}
                  >
                    <span className="truncate leading-none">{s.sucursal}</span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="h-px bg-border/40 mx-2 my-1" />

          {/* Pie: Cerrar Sesión */}
          <div className="pt-1 pb-0.5">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-all duration-200 active:scale-[0.98]"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, companies, isLoading, isAuthenticated } = useAuth();
  const { activeCompanyId } = useCompany();
  const current = ALL_NAV_ITEMS.find((i) => isActive(pathname, i.href));

  const isEffectivelyCollapsed = sidebarCollapsed && !sidebarHovered;

  // /login y /select-company se renderizan pelados, sin sidebar.
  const isLoginPage = pathname === "/login";
  const isSelectCompanyPage = pathname === "/select-company";
  const isBarelayout = isLoginPage || isSelectCompanyPage;

  // Si no estoy autenticado y no estoy en /login, redirijo.
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [isLoading, isAuthenticated, isLoginPage, pathname, router]);

  // Si estoy autenticado con 2+ empresas pero no hay una activa (recién
  // logueado, o le sacaron el acceso a la que tenía guardada), mando al
  // selector. La página /select-company escapa a esta regla (obviamente).
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (isSelectCompanyPage || isLoginPage) return;
    if (companies.length > 1 && activeCompanyId === null) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/select-company?next=${next}`);
    }
  }, [
    isLoading,
    isAuthenticated,
    companies.length,
    activeCompanyId,
    isSelectCompanyPage,
    isLoginPage,
    pathname,
    router,
  ]);

  // Auto-colapsar sidebar según la ruta:
  // - En Dashboard ("/"): sidebar expandido.
  // - En cualquier otra página: sidebar colapsado.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldCollapse = pathname !== "/";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarCollapsed(shouldCollapse);
    localStorage.setItem("kawii_sidebar_collapsed", String(shouldCollapse));
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("kawii_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  if (isBarelayout) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <ShieldCheck className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-sm">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full">
      {/* Sidebar — desktop */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/5 bg-surface/30 backdrop-blur-2xl py-5 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] lg:flex",
          isEffectivelyCollapsed ? "w-[68px]" : "w-64",
          sidebarHovered && sidebarCollapsed ? "shadow-[20px_0_40px_-10px_rgba(0,0,0,0.5)] border-r-0" : ""
        )}
      >
        <div className={cn("flex items-center", isEffectivelyCollapsed ? "justify-center" : "px-5")}>
          <Brand collapsed={isEffectivelyCollapsed} />
        </div>
        
        <div className={cn("mt-8 flex-1 overflow-y-auto w-full", isEffectivelyCollapsed ? "px-1" : "px-4")}>
          <NavLinks collapsed={isEffectivelyCollapsed} />
        </div>

        <div className={cn("border-t border-white/5 pt-4 flex flex-col gap-3 w-full", isEffectivelyCollapsed ? "px-1 items-center" : "px-4")}>
          <button
            onClick={toggleSidebar}
            className={cn(
              "flex items-center justify-center rounded-xl p-2 text-muted transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-2/40 hover:text-fg active:scale-[0.95]",
              isEffectivelyCollapsed ? "" : "w-full gap-2 justify-start mx-1"
            )}
            title={isEffectivelyCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isEffectivelyCollapsed ? <ChevronRight className="h-5 w-5" /> : <><ChevronLeft className="h-5 w-5" /> <span className="text-sm font-medium">Colapsar</span></>}
          </button>
          {!isEffectivelyCollapsed && <ApiStatus />}
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm animate-[fade-in_var(--duration-base)_var(--ease-premium)_both]"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/5 bg-surface/50 backdrop-blur-3xl px-3 py-5 shadow-modal",
              "animate-[slide-in-from-left_var(--duration-slow)_var(--ease-premium)_both]",
            )}
          >
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-premium)] hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-8 flex-1 overflow-y-auto px-1">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border-soft px-3 pt-4">
              <ApiStatus />
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col transition-[padding] duration-[var(--duration-base)] ease-[var(--ease-premium)]",
          sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-64"
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border-soft bg-bg/85 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-premium)] hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <h1 className="text-h3 font-heading font-semibold tracking-tight text-fg">
            {current?.label ?? "Resumen Ejecutivo"}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="lg:hidden">
              <ApiStatus />
            </div>
            <UnifiedHeaderMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
