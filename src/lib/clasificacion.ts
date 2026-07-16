/**
 * Taxonomía de clasificación de SKUs — ESPEJO EXACTO del clasificador del
 * backend `_classify_severidad_accion_causal` (app/routers/analytics.py).
 *
 * Cadena de la verdad:
 *   1. `_matriz_90d_base.sql` emite la columna "Clasificación": 38 etiquetas
 *      + un fallback (⚖️ CASO ATÍPICO).
 *   2. El backend colapsa cada etiqueta en (severidad, acción) y define el
 *      universo de /analytics/compras-catalogo como severidad 🔴 Crítico o
 *      🟠 Alta.
 *   3. Este módulo replica esas reglas EN EL MISMO ORDEN (el orden importa:
 *      varias reglas se solapan por substring) para que el kanban, el árbol y
 *      los KPIs del frontend cuenten EXACTAMENTE los mismos SKUs que el
 *      backend. Antes había dos taxonomías divergentes y los badges de un
 *      mismo nodo mostraban números distintos.
 *
 * INVARIANTE: severidad ∈ {crítico, alta}  ⟺  columna kanban "comprar"
 *             ⟺  el SKU está en /compras-catalogo.
 *
 * Si cambias una regla acá, cámbiala también en el backend (y al revés).
 */

/** Columnas del Action Board (Kanban). */
export type KanbanCol = "comprar" | "alertas" | "vigilar" | "lentos" | "liquidar";

/** Severidad del backend, sin el emoji (🔴 Crítico → "critico"). */
export type Severidad =
  | "critico"
  | "alta"
  | "media"
  | "exceso"
  | "nulo"
  | "bajo"
  | "sano"
  | "otro";

export interface Clasificacion {
  severidad: Severidad;
  /** Acción sugerida del backend (REPONER YA, LIQUIDAR, ESPERAR, …). */
  accion: string;
  /** Columna del kanban derivada de (severidad, acción). */
  kanban: KanbanCol;
}

/**
 * `todas`: la etiqueta debe contener TODOS estos textos (regla AND del backend,
 * p.ej. "ALTA ROTACIÓN" + "LOTE"). `alguna`: basta con uno (regla OR).
 */
interface Regla extends Clasificacion {
  todas?: string[];
  alguna?: string[];
}

const REGLAS: Regla[] = [
  // ── 🔴 Crítico — venta perdida cada día ────────────────────────────────
  { todas: ["OPORTUNIDAD PERDIDA"], severidad: "critico", accion: "REPONER YA", kanban: "comprar" },
  { todas: ["QUIEBRE DE BESTSELLER"], severidad: "critico", accion: "COMPRAR YA", kanban: "comprar" },
  { todas: ["BESTSELLER ACTIVO"], severidad: "critico", accion: "REPONER YA", kanban: "comprar" },
  { todas: ["ALTA ROTACIÓN", "LOTE"], severidad: "critico", accion: "REPONER YA", kanban: "comprar" },
  { todas: ["ALTA ROTACIÓN"], severidad: "critico", accion: "REPONER YA", kanban: "comprar" },

  // ── 🟠 Alta — reponer pronto ───────────────────────────────────────────
  { todas: ["BESTSELLER", "AGOTADO"], severidad: "alta", accion: "REPONER", kanban: "comprar" },
  { todas: ["AGOTADO CON DEMANDA"], severidad: "alta", accion: "REPONER", kanban: "comprar" },
  // Vende mucho, pero menos que antes: sigue siendo reposición (con menos
  // cantidad), NO un producto "lento". El backend lo mete a compras.
  { todas: ["ROTACIÓN BAJANDO"], severidad: "alta", accion: "REPONER MENOS", kanban: "comprar" },
  { todas: ["ROTACIÓN ACTIVA AL BORDE"], severidad: "alta", accion: "PEDIR YA", kanban: "comprar" },
  { todas: ["POCO STOCK CON DEMANDA"], severidad: "alta", accion: "REPONER", kanban: "comprar" },

  // ── 🟡 Media — vigilar / reponer poco / auditar ────────────────────────
  { todas: ["LENTO PERO CONSTANTE"], severidad: "media", accion: "REPONER POCO", kanban: "lentos" },
  { todas: ["EX-BESTSELLER ENFRIADO"], severidad: "media", accion: "EVALUAR", kanban: "alertas" },
  { todas: ["PRODUCTO EMERGENTE"], severidad: "media", accion: "VIGILAR", kanban: "vigilar" },
  { todas: ["VENDIENDO MÁS QUE ANTES"], severidad: "media", accion: "VIGILAR", kanban: "vigilar" },
  { todas: ["RECIBIDO Y NO VENDIDO"], severidad: "media", accion: "AUDITAR", kanban: "alertas" },
  { todas: ["STOCK BAJO QUIETO"], severidad: "media", accion: "VERIFICAR", kanban: "alertas" },
  { todas: ["RITMO PERDIDO"], severidad: "media", accion: "EVALUAR", kanban: "alertas" },
  { todas: ["VENDIÓ Y SE PERDIÓ"], severidad: "media", accion: "INVESTIGAR", kanban: "alertas" },

  // ── 🟣 Exceso — capital atrapado ───────────────────────────────────────
  { todas: ["EXCESO + DEMANDA CAYENDO"], severidad: "exceso", accion: "PROMOCIONAR YA", kanban: "lentos" },
  { alguna: ["EXCESO", "STOCK EXCESIVO"], severidad: "exceso", accion: "PROMOCIONAR", kanban: "lentos" },
  { todas: ["STOCK PARADO"], severidad: "exceso", accion: "LIQUIDAR", kanban: "liquidar" },
  { todas: ["LOTE FRENADO"], severidad: "exceso", accion: "LIQUIDAR", kanban: "liquidar" },
  { todas: ["BAJA ROTACIÓN"], severidad: "media", accion: "PEDIR MENOS", kanban: "lentos" },

  // ── ⚪ Nulo — no reponer / descatalogar ────────────────────────────────
  { todas: ["DEMANDA EXTINTA"], severidad: "nulo", accion: "NO REPONER", kanban: "liquidar" },
  { todas: ["PRODUCTO MUERTO"], severidad: "nulo", accion: "DESCATALOGAR", kanban: "liquidar" },
  { todas: ["BAJO VOLUMEN AGOTADO"], severidad: "nulo", accion: "DESCATALOGAR", kanban: "liquidar" },
  { todas: ["LENTO CRÓNICO"], severidad: "nulo", accion: "NO REPONER", kanban: "liquidar" },
  // Sin stock: no hay nada que liquidar, solo no corre prisa reponerlo.
  { todas: ["AGOTADO NO PRIORITARIO"], severidad: "bajo", accion: "ESPERAR", kanban: "vigilar" },
  { todas: ["PÉRDIDA DE STOCK"], severidad: "media", accion: "AUDITAR", kanban: "alertas" },

  // ── ⚪ Bajo — periodo de gracia: esperar, no tocar ─────────────────────
  { todas: ["PRODUCTO NUEVO"], severidad: "bajo", accion: "ESPERAR", kanban: "vigilar" },
  { alguna: ["RECIÉN REABASTECIDO", "STOCK RECIÉN LLEGADO"], severidad: "bajo", accion: "ESPERAR", kanban: "vigilar" },
  { todas: ["LOTE NUEVO VENDIENDO"], severidad: "sano", accion: "MANTENER", kanban: "vigilar" },
  { todas: ["TEMPORADA CERRADA"], severidad: "bajo", accion: "ESPERAR PRÓX. CAMPAÑA", kanban: "vigilar" },
  // El SQL dice literalmente "NO liquidar" en esta etiqueta.
  { todas: ["SALDO DE TEMPORADA"], severidad: "bajo", accion: "GUARDAR", kanban: "vigilar" },

  // ── 🟢 Sano — mantener ─────────────────────────────────────────────────
  { todas: ["INVENTARIO SANO"], severidad: "sano", accion: "MANTENER", kanban: "vigilar" },
  { todas: ["ROTACIÓN ACTIVA"], severidad: "sano", accion: "MANTENER", kanban: "vigilar" },
];

/** ⚖️ CASO ATÍPICO (el ELSE del SQL) y cualquier etiqueta futura sin regla. */
const FALLBACK: Clasificacion = { severidad: "otro", accion: "REVISAR", kanban: "alertas" };

/** Clasifica una etiqueta "Clasificación" de la matriz 04b/05. */
export function clasificarSku(etiqueta: string): Clasificacion {
  const L = (etiqueta || "").toUpperCase();
  for (const r of REGLAS) {
    const hit = r.todas
      ? r.todas.every((t) => L.includes(t))
      : (r.alguna ?? []).some((t) => L.includes(t));
    if (hit) return { severidad: r.severidad, accion: r.accion, kanban: r.kanban };
  }
  return FALLBACK;
}

/**
 * ¿El SKU pertenece al universo de /compras-catalogo? Es la MISMA condición
 * que `_is_quiebre_real` en el backend (severidad 🔴 Crítico o 🟠 Alta).
 */
export function esUniversoCompras(sev: Severidad): boolean {
  return sev === "critico" || sev === "alta";
}
