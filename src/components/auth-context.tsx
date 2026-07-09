"use client";

/**
 * AuthContext: estado de autenticación global (multi-tenant).
 *
 * Internamente usa React Query (`["auth-me"]`) para resolver la sesión:
 * hace `GET /auth/me` al montar; si vuelve 401, el query queda en
 * estado "errored" y `user` es null. Al hacer login, invalidamos para
 * que se refetchee.
 *
 * Multi-tenant: el response de /auth/me trae `companies` — la lista de
 * empresas donde el user tiene membresía. La empresa ACTIVA se elige y
 * persiste en el CompanyContext (no acá).
 *
 * Hooks expuestos:
 * - `useAuth()`         → { user, companies, isLoading, isAuthenticated, signIn, signOut }
 * - `useRequireAuth()`  → redirige a /login si no hay sesión
 * - `useRequireRole(roles)` → idem + valida que el user tenga ese rol en
 *                             al menos una de sus empresas (temporal —
 *                             debería validarse contra la empresa activa,
 *                             lo mejoramos cuando exista CompanyContext).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  getMe,
  login as apiLogin,
  logout as apiLogout,
  type AuthUser,
  type Company,
  type MeResponse,
  type UserRole,
} from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  companies: Company[];
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<Company[]>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

const AUTH_KEY = ["auth-me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  // Una sesión vencida da 401 — React Query lo trata como "error" y `data`
  // queda undefined. Lo convertimos a `null` en el consumidor.
  const q = useQuery({
    queryKey: AUTH_KEY,
    queryFn: ({ signal }) => getMe(signal),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 1;
    },
  });

  const signIn = useCallback(
    async (username: string, password: string): Promise<Company[]> => {
      const r = await apiLogin(username, password);
      // Pre-llenamos la cache con el formato de /auth/me (user + companies).
      const me: MeResponse = { ...r.user, companies: r.companies };
      qc.setQueryData(AUTH_KEY, me);
      await qc.invalidateQueries({ queryKey: AUTH_KEY });
      return r.companies;
    },
    [qc],
  );

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignoramos errores: limpiamos estado igual.
    }
    qc.setQueryData(AUTH_KEY, null);
    qc.clear();

    // Destruir las variables cacheadas de la sesión
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("kawii.company");
      window.localStorage.removeItem("kawii.sucursal");
      window.localStorage.removeItem("kawii-query-cache");
      // Force hard-redirect para resetear todo el estado de React/Next
      window.location.href = "/login";
    }
  }, [qc]);

  const me: MeResponse | null = q.data ?? null;
  const user: AuthUser | null = me
    ? { id: me.id, username: me.username, is_active: me.is_active }
    : null;
  const companies: Company[] = me?.companies ?? [];

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      companies,
      isLoading: q.isLoading,
      isAuthenticated: !!user,
      signIn,
      signOut,
    }),
    [user, companies, q.isLoading, signIn, signOut],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

/**
 * En cualquier página protegida: si no hay sesión, redirige a /login con
 * `next=` para que vuelva a esta página después del login.
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!isLoading && !user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [user, isLoading, pathname, router]);
  return { user, isLoading };
}

/** Valida que el user tenga uno de los roles pedidos en AL MENOS UNA de sus
 * empresas. Es un stub temporal — cuando exista CompanyContext, esta
 * validación debe hacerse contra el rol en la EMPRESA ACTIVA. */
export function useRequireRole(roles: UserRole[]) {
  const { user, companies, isLoading } = useAuth();
  const authGuard = useRequireAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoading || !user) return;
    const hasRole = companies.some((c) => roles.includes(c.role));
    if (!hasRole) {
      router.replace("/?forbidden=1");
    }
  }, [user, companies, isLoading, roles, router]);
  return authGuard;
}
