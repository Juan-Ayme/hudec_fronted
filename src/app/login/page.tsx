"use client";

/**
 * Página de login.
 *
 * El backend setea una cookie httpOnly al hacer `POST /auth/login`; el
 * cliente fetch ya manda esa cookie en cada request siguiente
 * (`credentials: 'include'`). Esta página no necesita guardar el token —
 * solo refrescar el AuthContext con `signIn()` y navegar a `next`.
 */

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Lock, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const { signIn, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya estoy autenticado y caí acá por accidente, voy directo al "next".
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(next);
    }
  }, [isLoading, isAuthenticated, next, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const companies = await signIn(username.trim(), password);
      // Con 2+ empresas mostramos el selector; con 1 sola vamos directo.
      if (companies.length > 1) {
        router.replace(`/select-company?next=${encodeURIComponent(next)}`);
      } else {
        router.replace(next);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? "Usuario o contraseña incorrectos."
            : err.status === 403
              ? "Usuario desactivado. Pedí al admin que te active."
              : err.message,
        );
      } else {
        setError("Error al iniciar sesión. Intentá de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <div className="py-4 px-4 md:px-8 w-full">
        <div className="grid items-center gap-6 max-w-6xl w-full mx-auto lg:grid-cols-2">
          
          <div className="border border-border rounded-lg p-6 max-w-md mx-auto shadow-sm md:p-8 lg:mx-0 bg-surface">
            <div className="mb-8">
              <h1 className="text-fg text-3xl font-bold mb-4">
                Iniciar sesión
              </h1>
              <p className="text-muted text-base leading-relaxed">
                Ingresá con tu usuario para acceder al panel y gestionar tus proyectos.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 text-fg font-medium text-sm inline-block"
                >
                  Usuario
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                  <input
                    type="text"
                    id="username"
                    autoFocus
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Tu usuario"
                    className="pl-10 px-3 py-2.5 text-sm text-fg rounded-md bg-surface-2 w-full outline-1 -outline-offset-1 outline-border focus:outline-2 focus:-outline-offset-2 focus:outline-primary transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 text-fg font-medium text-sm inline-block"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                  <input
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-10 px-3 py-2.5 text-sm text-fg rounded-md bg-surface-2 w-full outline-1 -outline-offset-1 outline-border focus:outline-2 focus:-outline-offset-2 focus:outline-primary transition-all"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-danger/40 bg-danger-dim/30 px-3 py-2 text-sm text-danger"
                >
                  {error}
                </div>
              )}

              <div className="flex items-start flex-wrap gap-2">
                <label className="flex items-center group has-[input:checked]:text-fg cursor-pointer">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    className="sr-only"
                  />
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded outline-1 outline-border bg-surface-2 group-has-[input:checked]:bg-primary group-has-[input:checked]:outline-primary group-focus-within:outline-2 group-focus-within:outline-primary transition-all"
                    aria-hidden="true"
                  >
                    <svg
                      className="size-3 text-primary-fg opacity-0 group-has-[input:checked]:opacity-100"
                      viewBox="0 0 12 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 5l3 3 7-7" />
                    </svg>
                  </span>
                  <span className="ml-3 text-sm text-muted">
                    Recordarme
                  </span>
                </label>

                <div className="ml-auto text-sm text-faint hover:text-fg transition-colors cursor-pointer">
                  ¿Olvidaste tu contraseña?
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !username.trim() || !password}
                className="w-full py-2 px-3.5 text-sm rounded-md font-semibold cursor-pointer tracking-wide text-primary-fg bg-primary hover:bg-primary-soft transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                {submitting ? "Ingresando…" : "Ingresar"}
              </button>
            </form>
          </div>

          <div className="aspect-[71/50] max-lg:w-4/5 mx-auto flex items-center justify-center p-6 bg-surface-2 rounded-2xl border border-border-soft shadow-sm">
            <svg
              className="w-full h-auto text-primary"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Dashboard Illustration"
              role="img"
            >
              {/* Background Card */}
              <rect x="40" y="50" width="320" height="200" rx="16" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" strokeOpacity="0.15"/>
              
              {/* Top Bar */}
              <path d="M40 66C40 57.1634 47.1634 50 56 50H344C352.837 50 360 57.1634 360 66V90H40V66Z" className="text-surface-4" fill="currentColor" />
              <circle cx="70" cy="70" r="5" fill="currentColor" className="text-danger" />
              <circle cx="90" cy="70" r="5" fill="currentColor" className="text-warning" />
              <circle cx="110" cy="70" r="5" fill="currentColor" className="text-success" />
              
              {/* Sidebar */}
              <rect x="60" y="110" width="60" height="120" rx="8" fill="currentColor" fillOpacity="0.08" />
              <rect x="70" y="125" width="40" height="8" rx="4" fill="currentColor" fillOpacity="0.15" />
              <rect x="70" y="145" width="30" height="8" rx="4" fill="currentColor" fillOpacity="0.15" />
              <rect x="70" y="165" width="35" height="8" rx="4" fill="currentColor" fillOpacity="0.15" />
              
              {/* Chart Area */}
              <rect x="140" y="110" width="200" height="120" rx="8" fill="currentColor" fillOpacity="0.03" />
              
              {/* Bar Chart */}
              <rect x="160" y="170" width="20" height="40" rx="4" fill="currentColor" fillOpacity="0.8" />
              <rect x="195" y="140" width="20" height="70" rx="4" fill="currentColor" fillOpacity="0.5" />
              <rect x="230" y="185" width="20" height="25" rx="4" fill="currentColor" fillOpacity="0.6" />
              <rect x="265" y="120" width="20" height="90" rx="4" fill="currentColor" />
              <rect x="300" y="155" width="20" height="55" rx="4" fill="currentColor" fillOpacity="0.7" />
              
              {/* Floating Element */}
              <g transform="translate(250, 30)">
                <rect width="90" height="40" rx="8" fill="currentColor" className="text-surface-2" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2"/>
                <rect x="15" y="16" width="30" height="8" rx="4" fill="currentColor" className="text-accent" />
                <circle cx="65" cy="20" r="8" fill="currentColor" className="text-primary" fillOpacity="0.2"/>
                <circle cx="65" cy="20" r="4" fill="currentColor" className="text-primary" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
