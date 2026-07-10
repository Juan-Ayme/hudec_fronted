import type { RotacionHistoricaSku } from "@/lib/types";

/* ────────────────────────────────────────────────────────────
 * Presets de período: año completo, trimestre, custom.
 * Las fechas se calculan al render (no se cachean) para que se actualicen al
 * cambiar de año/trimestre sin recargar la app.
 * ──────────────────────────────────────────────────────────── */
export type Preset = {
  id: string;
  label: string;
  range: () => { from: string; to: string };
};

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function yearRange(year: number) {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function quarterRange(year: number, q: 1 | 2 | 3 | 4) {
  const fromMonth = (q - 1) * 3 + 1;
  const toMonth = fromMonth + 2;
  const lastDay = new Date(year, toMonth, 0).getDate();
  return {
    from: `${year}-${String(fromMonth).padStart(2, "0")}-01`,
    to: `${year}-${String(toMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

export const CURRENT_YEAR = new Date().getFullYear();
export const PRESETS: Preset[] = [
  { id: "anio-actual", label: `Año ${CURRENT_YEAR}`, range: () => yearRange(CURRENT_YEAR) },
  { id: "anio-pasado", label: `Año ${CURRENT_YEAR - 1}`, range: () => yearRange(CURRENT_YEAR - 1) },
  { id: "q4-pasado", label: `Q4 ${CURRENT_YEAR - 1}`, range: () => quarterRange(CURRENT_YEAR - 1, 4) },
  { id: "q3-pasado", label: `Q3 ${CURRENT_YEAR - 1}`, range: () => quarterRange(CURRENT_YEAR - 1, 3) },
  {
    id: "ultimos-180d",
    label: "Últimos 180 días",
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 180);
      return { from: isoDate(from), to: isoDate(to) };
    },
  },
];

export type ParetoFilter = "todos" | "A" | "B" | "C";

/* ────────────────────────────────────────────────────────────
 * Taxonomy filter types — hierarchical: dept → cat → subcat
 * ──────────────────────────────────────────────────────────── */
export interface TaxFilter {
  dept: string | null;
  cat: string | null;
  subcat: string | null;
}

export const EMPTY_FILTER: TaxFilter = { dept: null, cat: null, subcat: null };

/* ────────────────────────────────────────────────────────────
 * Aggregated tree structures built from SKU data
 * ──────────────────────────────────────────────────────────── */
export interface SubcatNode {
  name: string;
  skus: number;
  venta_soles: number;
  unds: number;
}

export interface CatNode {
  name: string;
  skus: number;
  venta_soles: number;
  unds: number;
  subcats: SubcatNode[];
}

export interface DeptNode {
  name: string;
  skus: number;
  venta_soles: number;
  unds: number;
  cats: CatNode[];
}

export function buildTree(skus: RotacionHistoricaSku[]): DeptNode[] {
  const deptMap = new Map<string, {
    skus: Set<string>;
    venta: number;
    unds: number;
    cats: Map<string, {
      skus: Set<string>;
      venta: number;
      unds: number;
      subcats: Map<string, { skus: Set<string>; venta: number; unds: number }>;
    }>;
  }>();

  for (const s of skus) {
    const deptName = s.departamento || "(Sin departamento)";
    const catName = s.categoria || "(Sin categoría)";
    const subcatName = s.subcategoria || "(Sin subcategoría)";
    const skuKey = `${s.sucursal}::${s.sku}`;

    if (!deptMap.has(deptName)) {
      deptMap.set(deptName, { skus: new Set(), venta: 0, unds: 0, cats: new Map() });
    }
    const dept = deptMap.get(deptName)!;
    dept.skus.add(skuKey);
    dept.venta += s.vendido_sku_soles;
    dept.unds += s.unds_vendidas;

    if (!dept.cats.has(catName)) {
      dept.cats.set(catName, { skus: new Set(), venta: 0, unds: 0, subcats: new Map() });
    }
    const cat = dept.cats.get(catName)!;
    cat.skus.add(skuKey);
    cat.venta += s.vendido_sku_soles;
    cat.unds += s.unds_vendidas;

    if (!cat.subcats.has(subcatName)) {
      cat.subcats.set(subcatName, { skus: new Set(), venta: 0, unds: 0 });
    }
    const subcat = cat.subcats.get(subcatName)!;
    subcat.skus.add(skuKey);
    subcat.venta += s.vendido_sku_soles;
    subcat.unds += s.unds_vendidas;
  }

  // Convert to sorted arrays (by venta_soles descending)
  const result: DeptNode[] = [];
  for (const [dName, d] of deptMap) {
    const cats: CatNode[] = [];
    for (const [cName, c] of d.cats) {
      const subcats: SubcatNode[] = [];
      for (const [scName, sc] of c.subcats) {
        subcats.push({ name: scName, skus: sc.skus.size, venta_soles: sc.venta, unds: sc.unds });
      }
      subcats.sort((a, b) => b.venta_soles - a.venta_soles);
      cats.push({ name: cName, skus: c.skus.size, venta_soles: c.venta, unds: c.unds, subcats });
    }
    cats.sort((a, b) => b.venta_soles - a.venta_soles);
    result.push({ name: dName, skus: d.skus.size, venta_soles: d.venta, unds: d.unds, cats });
  }
  result.sort((a, b) => b.venta_soles - a.venta_soles);
  return result;
}
