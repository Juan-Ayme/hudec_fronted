import { getMatrix } from "@/lib/api";
import { getClasif } from "@/lib/matrix-classify";
import type { Row } from "../types";
import { s } from "../utils";

/**
 * Opciones del query de la matriz 04b (90d jerárquica). Compartidas entre
 * /ventas-jerarquicas y /centro-catalogo: MISMA queryKey → misma cache.
 */
export function matrix04bQueryOptions(sucursalName: string | null) {
  return {
    queryKey: ["matrix-04b", sucursalName] as const,
    queryFn: ({ signal }: { signal?: AbortSignal }) =>
      getMatrix("04b", { sucursal: sucursalName ?? undefined }, signal),
    staleTime: 5 * 60_000,
  };
}

/** Predicado de búsqueda sobre filas de la matriz: producto, SKU o clasificación. */
export function matrixSearchFilter(rows: Row[], busqueda: string): Row[] {
  if (!busqueda) return rows;
  const lowerB = busqueda.toLowerCase();
  return rows.filter(
    (r) =>
      s(r["Producto"]).toLowerCase().includes(lowerB) ||
      s(r["Código SKU"]).toLowerCase().includes(lowerB) ||
      getClasif(r as Record<string, unknown>).toLowerCase().includes(lowerB),
  );
}
