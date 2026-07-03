// Wrapper delgado de useQuery con defaults propios del módulo BI.
// Los endpoints /pulse, /diagnosis, /catalog-health y /plan comparten:
//   - staleTime alto (los datos no cambian hasta el próximo sync nocturno).
//   - retry con backoff (los queries pesados a veces caen por timeouts).
//   - refetchOnWindowFocus off (evita gastar quota cada vez que el user vuelve a la tab).

"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

/** Defaults compartidos por todos los hooks de BI. */
const DEFAULTS = {
  staleTime: 5 * 60_000,        // 5 min — coincide con la ventana de sync
  gcTime:    30 * 60_000,       // conservar 30 min en cache
  refetchOnWindowFocus: false,
  retry: 2,
  retryDelay: (i: number) => Math.min(1000 * 2 ** i, 4000),
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
