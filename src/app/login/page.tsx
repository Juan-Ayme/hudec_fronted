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
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const { signIn, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden">
      {/* ── Fondo: gradientes radiales sutiles ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(59,130,246,0.07) 0%, transparent 70%)",
            "radial-gradient(ellipse 40% 30% at 70% 80%, rgba(14,165,233,0.04) 0%, transparent 70%)",
          ].join(", "),
        }}
        aria-hidden="true"
      />

      {/* ── Card principal con glassmorphism ── */}
      <div
        className="relative z-10 w-full max-w-[400px] mx-4 animate-splash-fade-up"
      >
        {/* ── Logo + Brand ── */}
        <div
          className="flex flex-col items-center mb-10 animate-splash-fade-up"
          style={{ animationDelay: "0.05s" }}
        >
          {/* Logo app estilo iOS */}
          <div className="relative mb-5">
            <div
              className="absolute -inset-3 rounded-3xl animate-splash-glow"
              style={{
                background:
                  "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
              }}
              aria-hidden="true"
            />
            <div className="relative flex h-[60px] w-[60px] items-center justify-center rounded-[16px] bg-gradient-to-br from-primary to-accent shadow-[0_6px_24px_-4px_rgba(59,130,246,0.35)]">
              <span className="relative z-10 text-[22px] font-bold text-primary-fg tracking-tight select-none">
                K
              </span>
              <span
                className="absolute inset-0 rounded-[16px] bg-gradient-to-b from-white/20 via-white/5 to-transparent"
                aria-hidden="true"
              />
            </div>
          </div>
          <h1 className="text-[22px] font-semibold text-fg tracking-[-0.02em]">
            Iniciar sesión
          </h1>
          <p className="mt-1.5 text-[14px] text-muted/70 text-center leading-relaxed max-w-[280px]">
            Ingresa con tu cuenta para acceder al panel
          </p>
        </div>

        {/* ── Formulario con glassmorphism card ── */}
        <div
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-7 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.5)] animate-splash-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* ── Username ── */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-username"
                className="text-[13px] font-medium text-fg/80 pl-0.5"
              >
                Usuario
              </label>
              <input
                type="text"
                id="login-username"
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Tu usuario"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[15px] text-fg placeholder:text-muted/40 outline-none transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] focus:border-primary/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
              />
            </div>

            {/* ── Password ── */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="text-[13px] font-medium text-fg/80 pl-0.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 pr-11 text-[15px] text-fg placeholder:text-muted/40 outline-none transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] focus:border-primary/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted/40 hover:text-muted transition-colors duration-200"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* ── Error ── */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/[0.06] px-4 py-3 text-[13px] text-danger/90 leading-snug animate-splash-fade-up"
              >
                <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* ── Recordarme + Olvidé contraseña ── */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="sr-only peer"
                />
                <span
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.04] transition-all duration-200 peer-checked:bg-primary peer-checked:border-primary/60 peer-focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
                  aria-hidden="true"
                >
                  <svg
                    className="h-3 w-3 text-primary-fg opacity-0 peer-checked:group-[]:opacity-100 transition-opacity duration-150"
                    viewBox="0 0 12 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 5l3 3 7-7" />
                  </svg>
                </span>
                <span className="text-[13px] text-muted/60 group-hover:text-muted transition-colors duration-200">
                  Recordarme
                </span>
              </label>

              <button
                type="button"
                className="text-[13px] text-primary/70 hover:text-primary transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="group relative w-full mt-1 rounded-xl bg-primary py-3 px-4 text-[15px] font-semibold text-primary-fg tracking-[-0.01em] cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-primary-soft hover:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.4)] active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100"
            >
              {/* Reflejo superior tipo botón iOS */}
              <span
                className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none"
                aria-hidden="true"
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-splash-spinner" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
                      <path d="M16 3a13 13 0 0 1 13 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    Ingresando…
                  </>
                ) : (
                  "Ingresar"
                )}
              </span>
            </button>
          </form>
        </div>

        {/* ── Footer ── */}
        <p
          className="mt-8 text-center text-[12px] text-muted/30 tracking-wide animate-splash-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          KAWII · Business Intelligence
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg">
          <svg className="h-6 w-6 animate-splash-spinner text-primary" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
            <path d="M16 3a13 13 0 0 1 13 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
