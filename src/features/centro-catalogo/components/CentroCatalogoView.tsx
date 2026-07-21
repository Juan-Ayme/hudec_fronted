"use client";

import { useState } from "react";
import { BarChart3, Layers, Search, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { TreeLoader } from "@/components/ui/chart-loaders";
import { useCompany } from "@/components/company-context";
import type { ComprasCatalogoSku } from "@/lib/types";
import { RendimientoPanel } from "@/features/ventas-jerarquicas/components/RendimientoPanel";
import { ComprasPanel } from "@/features/compras-catalogo/components/ComprasPanel";

import type { MainTab } from "../types";
import { useCentroCatalogo } from "../hooks/useCentroCatalogo";
import { useCentroUrlState } from "../hooks/useCentroUrlState";
import { Breadcrumb } from "./Breadcrumb";
import { UnifiedTree, TreeSummaryCard } from "./UnifiedTree";
import { KpiHeader } from "./KpiHeader";
import { ExportMenu } from "./ExportMenu";

/**
 * Centro de Control de Catálogo — árbol jerárquico compartido a la izquierda,
 * pestañas [Rendimiento (Ventas)] / [Decisiones de Compra] a la derecha.
 * Ambos paneles quedan montados (el inactivo oculto) para que filtros,
 * paginación y drawers sobrevivan al cambio de pestaña.
 */
export function CentroCatalogoView() {
  const { activeRole } = useCompany();
  const canVerRendimiento = activeRole !== null;
  const { tab, selection, setTab, setSelection } = useCentroUrlState(canVerRendimiento);
  const state = useCentroCatalogo(selection);

  // Salto cruzado Rendimiento → Compras: SKU cuyo drawer se abre al llegar.
  const [pendingComprasSku, setPendingComprasSku] = useState<ComprasCatalogoSku | null>(null);
  const [showTreeMobile, setShowTreeMobile] = useState(false);

  const handleSkuJump = (skuCode: string) => {
    const found = state.allComprasSkus.find((x) => x.sku === skuCode);
    if (!found) return;
    setPendingComprasSku(found);
    setTab("compras");
  };

  const comprasBadge = state.kpiNode ? state.kpiNode.criticos + state.kpiNode.altas : null;

  const tabItems: TabItem<MainTab>[] = [
    ...(canVerRendimiento
      ? [
          {
            id: "rendimiento" as const,
            label: "Rendimiento (Ventas)",
            icon: BarChart3,
            badge: state.kpiNode?.skuCount ?? null,
          },
        ]
      : []),
    {
      id: "compras" as const,
      label: "Decisiones de Compra",
      icon: ShoppingCart,
      badge: state.officeId != null ? comprasBadge : null,
      badgeTone: "danger" as const,
      hint:
        state.officeId == null
          ? "Selecciona una sucursal para ver las sugerencias de compra"
          : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-6.5rem)]">
      {/* Fila de control: pestañas principales + búsqueda global + exportación */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Tabs items={tabItems} value={tab} onChange={setTab} />
        <div className="flex items-center gap-2">
          <div className="group relative flex-1 xl:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-white/50 transition-colors group-focus-within:text-white" />
            <Input
              placeholder="Buscar SKU, producto o clasificación..."
              value={state.search}
              onChange={(e) => state.setSearch(e.target.value)}
              className="h-8 bg-white/5 pl-8 pr-3 border-white/5 hover:bg-white/10 focus:bg-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all rounded-full text-xs placeholder:text-white/40 shadow-sm text-white"
            />
          </div>
          <ExportMenu
            sucursalName={state.sucursalName}
            officeId={state.officeId}
            canVerRendimiento={canVerRendimiento}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTreeMobile((v) => !v)}
            className="h-8 gap-1.5 rounded-full px-3 lg:hidden"
          >
            <Layers className="h-3.5 w-3.5" /> Jerarquía
          </Button>
        </div>
      </div>

      {/* Breadcrumb (indicador de selección) + KPIs del nodo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumb selection={selection} onNavigate={setSelection} />
        <KpiHeader node={state.kpiNode} showVentasMetrics={canVerRendimiento} />
      </div>

      {/* Workspace: árbol compartido + panel de la pestaña activa */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        <aside
          className={cn(
            "min-h-0 flex-col gap-3 overflow-hidden",
            showTreeMobile ? "flex max-h-[60vh]" : "hidden",
            "lg:flex lg:h-full lg:max-h-none",
          )}
        >
          <TreeSummaryCard
            tree={state.tree}
            scopeLabel={state.sucursalName ?? "Todas las tiendas"}
          />
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardBody className="min-h-0 flex-1 overflow-y-auto p-2 custom-scrollbar">
              {state.treeLoading ? (
                <TreeLoader />
              ) : (
                <UnifiedTree
                  tree={state.tree}
                  selection={selection}
                  onSelect={setSelection}
                  search={state.search}
                  totalSkus={state.totalSkus}
                  hasMatrix={canVerRendimiento}
                />
              )}
            </CardBody>
          </Card>
        </aside>

        <section className="relative flex min-h-0 flex-col">
          {canVerRendimiento && (
            <div className={cn("min-h-0 flex-1 flex-col", tab === "rendimiento" ? "flex" : "hidden")}>
              <RendimientoPanel
                rows={state.searchedMatrixRows}
                allRows={state.allMatrixRows}
                selection={selection}
                sucursalName={state.sucursalName}
                isLoading={state.matrixQ.isLoading}
                isError={state.matrixQ.isError}
                error={state.matrixQ.error}
                comprasSkuSet={state.comprasSkuSet}
                solicitadasSkuSet={state.solicitadasSkuSet}
                onSkuJump={handleSkuJump}
              />
            </div>
          )}
          <div className={cn("min-h-0 flex-1 flex-col", tab === "compras" ? "flex" : "hidden")}>
            <ComprasPanel
              skus={state.searchedComprasSkus}
              kpisTotal={state.comprasQ.data?.kpis.skus_criticos_total}
              selection={selection}
              officeId={state.officeId}
              isLoading={state.comprasQ.isLoading}
              isError={state.comprasQ.isError}
              solicitadasBySku={state.solicitadasBySku}
              openSkuRequest={pendingComprasSku}
              onSkuRequestHandled={() => setPendingComprasSku(null)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
