export type { Selection } from "@/lib/types";
export { ROOT_SELECTION } from "@/lib/types";

/** Pestañas principales del Centro de Control de Catálogo. */
export type MainTab = "rendimiento" | "compras";

/**
 * Nodo del árbol unificado (Departamento → Categoría → Subcategoría).
 * Mezcla métricas de la matriz 04b (ventas/kanban) con contadores del
 * universo de compras (críticos/altas/solicitados/sugeridos). Los campos
 * de la fuente ausente quedan en 0.
 */
export interface UnifiedNode {
  name: string;
  ventas: number;
  skuCount: number;
  /** Participación sobre el padre (raíz: sobre el total). Fracción 0..1. */
  pct: number;
  paraComprar: number;
  saludables: number;
  criticos: number;
  altas: number;
  solicitados: number;
  /** Suma de cantidad_sugerida (unidades a reponer) del subconjunto compras. */
  sugeridos: number;
  children: UnifiedNode[];
}
