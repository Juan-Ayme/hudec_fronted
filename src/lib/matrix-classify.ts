// Helpers para leer filas de las matrices de SKUs (módulo 04b / 05).
// Adaptado del frontend hermano COYA.

export type MatrixRow = Record<string, unknown>;

/**
 * Lee la clasificación de una fila. El backend renombra "Clasificación" según
 * CLASSIFICATION_LABEL (ej. "Clasificación HUDEC"), así que buscamos en orden:
 *   1. "Clasificación" exacto
 *   2. cualquier clave que empiece con "clasif" (cubre el rename white-label)
 *   3. heurística: un valor string con pinta de etiqueta de clasificación
 */
export function getClasif(row: MatrixRow): string {
  if (row["Clasificación"] != null) return String(row["Clasificación"]);
  for (const key of Object.keys(row)) {
    if (key.toLowerCase().startsWith("clasif")) {
      const v = row[key];
      if (v != null) return String(v);
    }
  }
  for (const v of Object.values(row)) {
    if (
      typeof v === "string" &&
      /[🔥💎🐢💀🌱👀📈🧊⛔💫📉⏸️✨🪦⚠️✅📦🆕🔄🟢⚖️]|BESTSELLER|MUERTO|STOCK PARADO|LOTE FRENADO|ROTACIÓN|EXCESO|PRODUCTO NUEVO|ALERTA|BAJA|PÉRDIDA|RITMO PERDIDO|OPORTUNIDAD PERDIDA|REABASTECIDO/i.test(v)
    ) {
      return v;
    }
  }
  return "";
}

export function str(v: unknown): string {
  if (v === null || v === undefined) return "—";
  return String(v);
}

export function toNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
