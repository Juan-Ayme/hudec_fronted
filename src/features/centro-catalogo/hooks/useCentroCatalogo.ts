"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSucursal } from "@/components/sucursal-context";
import { useCompany } from "@/components/company-context";
import {
  getComprasCatalogo,
  listPurchaseDecisions,
  type PurchaseDecision,
} from "@/lib/api";
import type { ComprasCatalogoSku, Selection } from "@/lib/types";
import type { Row } from "@/features/ventas-jerarquicas/types";
import {
  matrix04bQueryOptions,
  matrixSearchFilter,
} from "@/features/ventas-jerarquicas/hooks/matrix04b";
import { comprasSearchFilter } from "@/features/compras-catalogo/utils";
import { buildUnifiedTree, findNode } from "../utils/buildUnifiedTree";

/**
 * Contenedor de datos del Centro de Catálogo: los dos queries (matriz 04b y
 * compras-catalogo, MISMAS queryKeys que las páginas viejas → cache
 * compartida), las solicitadas, la búsqueda global y el árbol unificado.
 */
export function useCentroCatalogo(selection: Selection) {
  const { officeId, sucursalName } = useSucursal();
  const { activeRole } = useCompany();
  const isViewer = activeRole === "viewer";
  const canVerRendimiento = activeRole === "admin" || activeRole === "operador";

  // Matriz 04b (universo completo). NO se consulta para viewer — hoy tampoco
  // tiene acceso a /ventas-jerarquicas. Gate estricto contra rol null.
  const matrixQ = useQuery({
    ...matrix04bQueryOptions(sucursalName),
    enabled: canVerRendimiento,
  });

  // Compras: requiere sucursal específica. (Mejora vs la página vieja, que
  // fetcheaba el consolidado aunque la UI mostrara el EmptyState.)
  const comprasQ = useQuery({
    queryKey: ["compras-catalogo", officeId],
    queryFn: ({ signal }) => getComprasCatalogo(officeId, signal),
    staleTime: 5 * 60_000,
    enabled: officeId != null,
  });

  // Decisiones vigentes 'solicitado' (badges por fila, filtro y árbol). Key
  // con prefijo ["purchase-decisions", …] para que la invalidación de las
  // mutaciones la alcance.
  const solicitadasQ = useQuery({
    queryKey: ["purchase-decisions", "active", officeId],
    queryFn: ({ signal }) =>
      listPurchaseDecisions({ office_id: officeId, decision: "solicitado" }, signal),
    enabled: officeId != null,
    staleTime: 60_000,
  });

  const solicitadasBySku = useMemo(() => {
    const m = new Map<string, PurchaseDecision>();
    for (const d of solicitadasQ.data?.decisions ?? []) {
      if (d.sku) m.set(d.sku, d);
    }
    return m;
  }, [solicitadasQ.data]);

  const [search, setSearch] = useState("");

  const allMatrixRows = useMemo<Row[]>(() => matrixQ.data?.rows ?? [], [matrixQ.data]);
  const searchedMatrixRows = useMemo(
    () => matrixSearchFilter(allMatrixRows, search),
    [allMatrixRows, search],
  );

  const allComprasSkus = useMemo<ComprasCatalogoSku[]>(
    () => comprasQ.data?.skus ?? [],
    [comprasQ.data],
  );
  const searchedComprasSkus = useMemo(
    () => comprasSearchFilter(allComprasSkus, search),
    [allComprasSkus, search],
  );

  const solicitadasSkuSet = useMemo(
    () => new Set(solicitadasBySku.keys()),
    [solicitadasBySku],
  );

  // Árbol unificado: para admin/operador la matriz define la forma (superset)
  // y compras solo suma badges; para viewer se construye solo de compras.
  const tree = useMemo(
    () =>
      buildUnifiedTree({
        matrixRows: canVerRendimiento && matrixQ.data ? searchedMatrixRows : undefined,
        comprasSkus: searchedComprasSkus,
        solicitadasSkus: solicitadasSkuSet,
      }),
    [canVerRendimiento, matrixQ.data, searchedMatrixRows, searchedComprasSkus, solicitadasSkuSet],
  );

  const treeLoading = canVerRendimiento
    ? matrixQ.isLoading
    : officeId != null && comprasQ.isLoading;

  const totalSkus = useMemo(() => tree.reduce((a, d) => a + d.skuCount, 0), [tree]);

  // Nodo de la selección actual — alimenta KPIs y badges de pestañas.
  const kpiNode = useMemo(() => findNode(tree, selection), [tree, selection]);

  // SKUs presentes en el universo de compras → botón de salto en Rendimiento.
  const comprasSkuSet = useMemo(
    () => new Set(allComprasSkus.map((x) => x.sku)),
    [allComprasSkus],
  );

  return {
    officeId,
    sucursalName,
    activeRole,
    isViewer,
    canVerRendimiento,
    matrixQ,
    comprasQ,
    search,
    setSearch,
    allMatrixRows,
    searchedMatrixRows,
    allComprasSkus,
    searchedComprasSkus,
    solicitadasBySku,
    tree,
    treeLoading,
    totalSkus,
    kpiNode,
    comprasSkuSet,
    solicitadasSkuSet,
  };
}
