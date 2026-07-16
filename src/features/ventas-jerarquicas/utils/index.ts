import { KanbanCol, Row } from "../types";
import { getClasif } from "@/lib/matrix-classify";
import { clasificarSku } from "@/lib/clasificacion";

export const s = (v: unknown): string => (v == null ? "" : String(v));

export const n = (v: unknown): number => {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const str = String(v);
  const m = str.match(/-?\d+(\.\d+)?/);
  if (m) {
    const p = parseFloat(m[0]);
    return Number.isFinite(p) ? p : 0;
  }
  return 0;
};

/**
 * Columna del kanban de una fila de la matriz. Delega en `clasificarSku`, el
 * espejo del clasificador del backend, para que "comprar" sea exactamente el
 * universo de /compras-catalogo (severidad Crítico + Alta) y ninguna etiqueta
 * caiga por descarte en "liquidar".
 */
export function getKanbanColumn(row: Row): KanbanCol {
  return clasificarSku(getClasif(row as Record<string, unknown>)).kanban;
}
