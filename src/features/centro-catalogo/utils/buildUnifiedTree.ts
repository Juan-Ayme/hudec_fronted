import type { ComprasCatalogoSku, Selection } from "@/lib/types";
import type { Row } from "@/features/ventas-jerarquicas/types";
import { getKanbanColumn, n, s } from "@/features/ventas-jerarquicas/utils";
import type { UnifiedNode } from "../types";

/*
 * Normalización de nombres de jerarquía — ÚNICO punto donde se resuelve el
 * mapeo entre las claves de la matriz 04b ("Departamento"/"Categoría"/
 * "Subcategoría", strings en español) y las de compras-catalogo
 * (departamento/categoria/subcategoria, snake_case, nullable).
 * Los paneles deben filtrar con estos MISMOS helpers para que los nodos
 * fallback ("Sin departamento", …) del árbol sí matcheen filas.
 */
export const normDept = (v: string | null | undefined): string => v || "Sin departamento";
export const normCat = (v: string | null | undefined): string => v || "Sin categoría";
export const normSubcat = (v: string | null | undefined): string => v || "Sin subcategoría";

type Acc = Omit<UnifiedNode, "children" | "pct"> & { children: Map<string, Acc> };

function makeAcc(name: string): Acc {
  return {
    name,
    ventas: 0,
    skuCount: 0,
    paraComprar: 0,
    saludables: 0,
    criticos: 0,
    altas: 0,
    solicitados: 0,
    sugeridos: 0,
    children: new Map(),
  };
}

function getOrCreate(map: Map<string, Acc>, name: string): Acc {
  let acc = map.get(name);
  if (!acc) {
    acc = makeAcc(name);
    map.set(name, acc);
  }
  return acc;
}

/**
 * Construye el árbol unificado.
 * - `matrixRows` (universo completo 04b) aporta ventas/skuCount/kanban.
 * - `comprasSkus` (subconjunto crítico) aporta los badges; si NO hay matriz
 *   (modo viewer, que no consulta 04b) aporta también ventas/skuCount.
 * Compras es subconjunto de 04b, así que con ambas fuentes la pasada 2 solo
 * incrementa contadores sobre nodos ya existentes.
 */
export function buildUnifiedTree({
  matrixRows,
  comprasSkus,
  solicitadasSkus,
}: {
  matrixRows?: Row[];
  comprasSkus?: ComprasCatalogoSku[];
  solicitadasSkus?: Set<string>;
}): UnifiedNode[] {
  const roots = new Map<string, Acc>();

  for (const r of matrixRows ?? []) {
    const names = [
      normDept(s(r["Departamento"])),
      normCat(s(r["Categoría"])),
      normSubcat(s(r["Subcategoría"])),
    ];
    const v = n(r["Vendido SKU S/"]);
    const col = getKanbanColumn(r);
    let map = roots;
    for (const name of names) {
      const acc = getOrCreate(map, name);
      acc.ventas += v;
      acc.skuCount += 1;
      if (col === "comprar") acc.paraComprar += 1;
      if (col === "vigilar") acc.saludables += 1;
      map = acc.children;
    }
  }

  const comprasAportaMetricas = !matrixRows;
  for (const sku of comprasSkus ?? []) {
    const names = [
      normDept(sku.departamento),
      normCat(sku.categoria),
      normSubcat(sku.subcategoria),
    ];
    const esCritico = sku.severidad.includes("Crítico");
    const esAlta = sku.severidad.includes("Alta");
    const esSolicitado = solicitadasSkus?.has(sku.sku) ?? false;
    const sugerido = sku.cantidad_sugerida > 0 ? sku.cantidad_sugerida : 0;
    let map = roots;
    for (const name of names) {
      const acc = getOrCreate(map, name);
      if (esCritico) acc.criticos += 1;
      if (esAlta) acc.altas += 1;
      if (esSolicitado) acc.solicitados += 1;
      acc.sugeridos += sugerido;
      if (comprasAportaMetricas) {
        acc.ventas += sku.vendido_sku_soles;
        acc.skuCount += 1;
      }
      map = acc.children;
    }
  }

  const toNodes = (map: Map<string, Acc>, parentVentas: number | null): UnifiedNode[] => {
    const accs = [...map.values()].sort((a, b) => b.ventas - a.ventas);
    const total = parentVentas ?? accs.reduce((sum, a) => sum + a.ventas, 0);
    return accs.map((a) => ({
      name: a.name,
      ventas: a.ventas,
      skuCount: a.skuCount,
      pct: total > 0 ? a.ventas / total : 0,
      paraComprar: a.paraComprar,
      saludables: a.saludables,
      criticos: a.criticos,
      altas: a.altas,
      solicitados: a.solicitados,
      sugeridos: a.sugeridos,
      children: toNodes(a.children, a.ventas),
    }));
  };

  return toNodes(roots, null);
}

/** Agrega los totales de una lista de nodos en un nodo sintético. */
export function aggregateNodes(nodes: UnifiedNode[], name: string): UnifiedNode {
  const agg: UnifiedNode = {
    name,
    ventas: 0,
    skuCount: 0,
    pct: 1,
    paraComprar: 0,
    saludables: 0,
    criticos: 0,
    altas: 0,
    solicitados: 0,
    sugeridos: 0,
    children: [],
  };
  for (const d of nodes) {
    agg.ventas += d.ventas;
    agg.skuCount += d.skuCount;
    agg.paraComprar += d.paraComprar;
    agg.saludables += d.saludables;
    agg.criticos += d.criticos;
    agg.altas += d.altas;
    agg.solicitados += d.solicitados;
    agg.sugeridos += d.sugeridos;
  }
  return agg;
}

/**
 * Nodo que corresponde a la selección actual. Con selección raíz devuelve un
 * agregado de todo el árbol; si el nodo ya no existe (cambio de sucursal,
 * búsqueda) devuelve null.
 */
export function findNode(tree: UnifiedNode[], sel: Selection): UnifiedNode | null {
  if (!sel.dept) return aggregateNodes(tree, "Todos los productos");
  const dept = tree.find((d) => d.name === sel.dept);
  if (!dept) return null;
  if (!sel.cat) return dept;
  const cat = dept.children.find((c) => c.name === sel.cat);
  if (!cat) return null;
  if (!sel.subcat) return cat;
  return cat.children.find((sc) => sc.name === sel.subcat) ?? null;
}
