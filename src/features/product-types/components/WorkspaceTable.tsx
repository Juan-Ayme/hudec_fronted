"use client";

import { useMemo } from "react";
import {
  Pencil,
  Link2Off,
  RefreshCw,
  Trash2,
  Tags,
  CircleAlert,
  GitMerge,
  Layers,
  ArrowRight,
  Boxes,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import { updateProductType } from "@/lib/api";
import { num } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProductType } from "@/lib/types";

export type WorkspaceTrayId = "unmapped_with_products" | "unmapped_empty" | "mapped";

interface WorkspaceTableProps {
  items: ProductType[];
  isLoading: boolean;
  activeTray: WorkspaceTrayId;
  search: string;
  setSearch: (s: string) => void;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: (ids: number[]) => void;
  onClearSelection: () => void;
  onEdit: (pt: ProductType) => void;
  onResync: (id: number) => void;
  onDelete: (pt: ProductType) => void;
  onOpenBulkMap: (types: ProductType[]) => void;
  onOpenBulkDelete: (types: ProductType[], deleteAllEmpty?: boolean) => void;
  onOpenMerge: (types: ProductType[]) => void;
  onOpenMoveProducts: (pt?: ProductType) => void;
  invalidate: () => void;
}

export function WorkspaceTable({
  items,
  isLoading,
  activeTray,
  search,
  setSearch,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onEdit,
  onResync,
  onDelete,
  onOpenBulkMap,
  onOpenBulkDelete,
  onOpenMerge,
  onOpenMoveProducts,
  invalidate,
}: WorkspaceTableProps) {
  // Filtrar por término de búsqueda
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        String(item.bsale_product_type_id).includes(q) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q))
    );
  }, [items, search]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(item.bsale_product_type_id));
  }, [items, selectedIds]);

  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.has(item.bsale_product_type_id));
  const someFilteredSelected =
    filteredItems.some((item) => selectedIds.has(item.bsale_product_type_id)) &&
    !allFilteredSelected;

  const handleMasterCheckbox = () => {
    if (allFilteredSelected) {
      onClearSelection();
    } else {
      onSelectAll(filteredItems.map((item) => item.bsale_product_type_id));
    }
  };

  return (
    <div className="space-y-3">
      {/* Barra de herramientas / Búsqueda y Acciones Masivas */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-2 p-3 rounded-lg border border-border">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Buscar por tipo, ID o taxonomía..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs text-xs px-3 py-1.5 bg-surface-1 border border-border rounded-md text-fg placeholder:text-muted focus:outline-none focus:border-primary"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-faint hover:text-fg px-1.5 py-1"
            >
              Limpiar
            </button>
          )}
          <span className="text-xs text-faint hidden md:inline">
            {filteredItems.length} tipos en esta bandeja
          </span>
        </div>

        {/* Acciones para elementos seleccionados */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {selectedIds.size > 0 && (
            <span className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded border border-primary/20">
              {selectedIds.size} seleccionados
            </span>
          )}

          {activeTray === "unmapped_with_products" && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={() => onOpenBulkMap(selectedItems)}
                className="text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <Layers className="h-3.5 w-3.5" />
                Mapear a Subcategoría ({selectedIds.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={() => onOpenMerge(selectedItems)}
                className="text-xs gap-1.5 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
              >
                <GitMerge className="h-3.5 w-3.5" />
                Fusionar ({selectedIds.size})
              </Button>
            </>
          )}

          {activeTray === "unmapped_empty" && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={() => onOpenBulkDelete(selectedItems, false)}
                className="text-xs gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar Seleccionados ({selectedIds.size})
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => onOpenBulkDelete(items, true)}
                className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-500 text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpiar Todos los Vacíos ({items.length})
              </Button>
            </>
          )}

          {activeTray === "mapped" && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={() => onOpenBulkMap(selectedItems)}
                className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Layers className="h-3.5 w-3.5" />
                Re-mapear ({selectedIds.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0}
                onClick={() => onOpenMerge(selectedItems)}
                className="text-xs gap-1.5 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
              >
                <GitMerge className="h-3.5 w-3.5" />
                Fusionar ({selectedIds.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabla con Estilo Kawii */}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface-1">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-faint">
              <th className="py-2.5 px-3 w-10 text-center">
                <button
                  type="button"
                  onClick={handleMasterCheckbox}
                  className="p-1 hover:text-fg text-faint rounded"
                  title={allFilteredSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                >
                  {allFilteredSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : someFilteredSelected ? (
                    <MinusSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3 font-semibold text-fg">Tipo de Producto (BSale)</th>
              <th className="py-2.5 px-3 font-semibold text-fg">Taxonomía Asignada</th>
              <th className="py-2.5 px-3 font-semibold text-fg text-right">Productos</th>
              <th className="py-2.5 px-3 font-semibold text-fg text-center">Estado BSale</th>
              <th className="py-2.5 px-3 font-semibold text-fg text-right w-36">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-faint">
                  Cargando catálogo de tipos...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-faint">
                  {search
                    ? "No se encontraron tipos con el filtro aplicado."
                    : activeTray === "unmapped_with_products"
                    ? "🎉 ¡Excelente! No hay tipos huérfanos con productos pendientes de mapear."
                    : activeTray === "unmapped_empty"
                    ? "✨ No hay tipos vacíos sin mapear. Tu catálogo está limpio."
                    : "No hay tipos en esta lista."}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.bsale_product_type_id);
                const totalProds =
                  (item.productos_activos ?? 0) + (item.productos_inactivos ?? 0) ||
                  item.productos ||
                  0;

                return (
                  <tr
                    key={item.bsale_product_type_id}
                    onClick={() => onToggleSelect(item.bsale_product_type_id)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-surface-2/60"
                    )}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-2.5 px-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleSelect(item.bsale_product_type_id)}
                        className="p-1 hover:text-fg text-faint rounded"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* Nombre e ID */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-faint">
                          #{item.bsale_product_type_id}
                        </span>
                        <span className="font-medium text-fg">{item.name}</span>
                        {!item.naming_ok && item.is_mapped && (
                          <span
                            title={`Nombre sugerido: "${item.expected_name || `${item.category} / ${item.subcategory}`}"`}
                          >
                            <CircleAlert className="h-3.5 w-3.5 text-warning shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mapeo */}
                    <td className="py-2.5 px-3">
                      {item.is_mapped ? (
                        <div>
                          <span className="font-medium text-fg">{item.subcategory}</span>
                          <span className="text-faint text-[11px]">
                            {" "}
                            · {item.department} / {item.category}
                          </span>
                        </div>
                      ) : (
                        <Badge tone="warning">Sin mapear</Badge>
                      )}
                    </td>

                    {/* Productos */}
                    <td className="py-2.5 px-3 text-right">
                      {totalProds === 0 ? (
                        <span className="text-faint">0 prods</span>
                      ) : (
                        <div>
                          <span className="font-medium text-fg">{num(totalProds)}</span>
                          {(item.productos_activos !== undefined ||
                            item.productos_inactivos !== undefined) && (
                            <div className="text-[10px] text-faint">
                              {item.productos_activos ?? 0} act · {item.productos_inactivos ?? 0} inact
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-2.5 px-3 text-center">
                      {item.is_active ? (
                        <Badge tone="success">Activo</Badge>
                      ) : (
                        <Badge tone="neutral">Inactivo</Badge>
                      )}
                    </td>

                    {/* Acciones */}
                    <td
                      className="py-2.5 px-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          title="Editar / Mapear individualmente"
                          className="p-1 rounded text-faint hover:text-fg hover:bg-surface-3 transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {item.is_mapped && (
                          <button
                            onClick={() =>
                              updateProductType(item.bsale_product_type_id, {}, true).then(
                                invalidate
                              )
                            }
                            title="Quitar mapeo de subcategoría"
                            className="p-1 rounded text-faint hover:text-warning hover:bg-warning/15 transition"
                          >
                            <Link2Off className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onResync(item.bsale_product_type_id)}
                          title="Resincronizar desde BSale"
                          className="p-1 rounded text-faint hover:text-fg hover:bg-surface-3 transition"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => onDelete(item)}
                          title="Eliminar tipo"
                          className="p-1 rounded text-faint hover:text-danger hover:bg-danger/15 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-faint px-1">
        <span>
          Mostrando {filteredItems.length} de {items.length} tipos en esta vista
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <CircleAlert className="h-3.5 w-3.5 text-warning" /> Nombres sin convención "Cat / Subcat"
          </span>
        </div>
      </div>
    </div>
  );
}

