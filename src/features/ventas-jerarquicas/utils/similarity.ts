import { Row, KanbanCol } from "../types";
import { getKanbanColumn, n, s } from "./index";

const STOPWORDS = new Set([
  "de", "la", "el", "los", "las", "para", "con", "sin", "por", "del", "al",
  "un", "una", "unos", "unas", "se", "su", "sus", "que",
  "und", "uds", "unidad", "unidades", "pack", "caja", "bolsa",
]);

const PRESENTATION_RE = /^\d+(\.\d+)?(ml|cl|kg|gr|cm|mm|oz|pcs|pz|und|uds|hjs|hs|hjas|h)$/i;
const PURE_DIGITS_RE = /^\d+(\.\d+)?$/;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Stemming ligero singular/plural: "hisopos" → "hisopo", "papeles" → "papel".
// Debe mantenerse IDÉNTICO al backend (backend_hudec/analytics/similares.py),
// que calcula los similares del Excel de compras y de /compras-catalogo.
function stem(token: string): string {
  if (token.endsWith("es") && token.length >= 5) return token.slice(0, -2);
  if (token.endsWith("s") && token.length >= 4) return token.slice(0, -1);
  return token;
}

function tokenize(name: string): Set<string> {
  const tokens = new Set<string>();
  for (const t of normalize(name).split(" ")) {
    if (t.length < 3) continue;
    if (STOPWORDS.has(t)) continue;
    if (PRESENTATION_RE.test(t)) continue;
    if (PURE_DIGITS_RE.test(t)) continue;
    tokens.add(stem(t));
  }
  return tokens;
}

export type SimilarItem = {
  sku: string;
  producto: string;
  estado: KanbanCol;
  stock: number;
  cobertura: string;
  unidades: number;
};

export type SimilarsInfo = {
  vigilar: number;
  lentos: number;
  liquidar: number;
  items: SimilarItem[];
};

const MIN_SHARED_TOKENS = 2;
const SIMILAR_TARGET_COLS: ReadonlySet<KanbanCol> = new Set(["vigilar", "lentos", "liquidar"]);
const STATUS_ORDER: Record<KanbanCol, number> = {
  vigilar: 0,
  lentos: 1,
  liquidar: 2,
  alertas: 3,
  comprar: 4,
};

export function buildSimilarityIndex(rows: Row[]): Map<string, SimilarsInfo> {
  type Entry = { row: Row; tokens: Set<string>; col: KanbanCol };
  const groups = new Map<string, Entry[]>();

  for (const row of rows) {
    const subcat = s(row["Subcategoría"]) || s(row["Categoría"]) || "—";
    const tokens = tokenize(s(row["Producto"]));
    if (tokens.size === 0) continue;
    const col = getKanbanColumn(row);
    const arr = groups.get(subcat);
    if (arr) arr.push({ row, tokens, col });
    else groups.set(subcat, [{ row, tokens, col }]);
  }

  const result = new Map<string, SimilarsInfo>();

  for (const entries of groups.values()) {
    if (entries.length < 2) continue;

    for (const target of entries) {
      if (target.col !== "comprar") continue;
      const targetSku = s(target.row["Código SKU"]);
      if (!targetSku) continue;

      const counts = { vigilar: 0, lentos: 0, liquidar: 0 };
      const items: SimilarItem[] = [];

      for (const candidate of entries) {
        if (candidate === target) continue;
        if (!SIMILAR_TARGET_COLS.has(candidate.col)) continue;
        // Un similar agotado no sustituye nada (idéntico al backend
        // analytics/similares.py): solo cuenta si tiene stock en tienda.
        const candStock = n(candidate.row["Stock Disp"]);
        if (candStock <= 0) continue;

        let shared = 0;
        for (const t of target.tokens) {
          if (candidate.tokens.has(t)) {
            shared++;
            if (shared >= MIN_SHARED_TOKENS) break;
          }
        }
        // Umbral adaptativo (idéntico al backend): ≥2 tokens compartidos, o
        // 1 solo si cubre ≥50% del nombre más corto — ej. "BYWIN HISOPOS X
        // 505 UND" {bywin, hisopo} vs "HISOPO POTE PEQUEÑO".
        const minSize = Math.min(target.tokens.size, candidate.tokens.size);
        const isSimilar =
          shared >= MIN_SHARED_TOKENS || (shared >= 1 && shared / minSize >= 0.5);
        if (!isSimilar) continue;

        counts[candidate.col as "vigilar" | "lentos" | "liquidar"]++;
        items.push({
          sku: s(candidate.row["Código SKU"]),
          producto: s(candidate.row["Producto"]),
          estado: candidate.col,
          stock: candStock,
          cobertura: s(candidate.row["Cobertura"]) || "—",
          unidades: n(candidate.row["Unds Vend (90d)"]),
        });
      }

      if (items.length === 0) continue;
      items.sort(
        (a, b) =>
          STATUS_ORDER[a.estado] - STATUS_ORDER[b.estado] || b.stock - a.stock,
      );
      result.set(targetSku, { ...counts, items });
    }
  }

  return result;
}

export function similarsLabel(info: SimilarsInfo): string {
  const parts: string[] = [];
  if (info.vigilar > 0) parts.push(`${info.vigilar} en saludable`);
  if (info.lentos > 0) parts.push(`${info.lentos} en lentos`);
  if (info.liquidar > 0) parts.push(`${info.liquidar} en liquidar`);
  return parts.slice(0, 2).join(" · ");
}
