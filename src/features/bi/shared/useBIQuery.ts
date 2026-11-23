// Wrapper delgado de useQuery con defaults propios del módulo BI e Informes.
//   - staleTime alto (los datos no cambian hasta el próximo sync).
//   - refetchOnWindowFocus off (evita gastar cómputo cada vez que el user vuelve a la tab).
//   - reintento SOLO cuando sirve (ver `reintentar`).

"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

/**
 * ¿Vale la pena repetir la consulta? Solo una vez, y solo si el servidor no llegó a
 * responder bien por algo pasajero: 502/503/504 (Render despertando, proxy caído).
 *
 * No se reintenta un 4xx (la respuesta no va a cambiar: sin datos, sin permiso, parámetro
 * malo) ni un 500 o un corte de tiempo: los informes pesados tardan minutos y repetirlos
 * dos veces más triplicaba la carga en la base sin dar otro resultado. Antes `retry: 2`
 * pisaba la regla general del QueryClient y reintentaba todo.
 */
export function reintentar(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  return error instanceof ApiError && [502, 503, 504].includes(error.status);
}

/** Defaults compartidos por todos los hooks de BI. */
const DEFAULTS = {
  staleTime: 5 * 60_000,        // 5 min — coincide con la ventana de sync
  gcTime:    30 * 60_000,       // conservar 30 min en cache
  refetchOnWindowFocus: false,
  retry: reintentar,
  retryDelay: 3000,
} as const;

/**
 * Wrapper de `useQuery` que aplica los defaults del módulo BI.
 * Es un simple passthrough — los defaults pueden pisarse con overrides.
 */
export function useBIQuery<TData, TError = unknown>(
  opts: UseQueryOptions<TData, TError, TData, readonly unknown[]>,
) {
  return useQuery({ ...DEFAULTS, ...opts });
}
