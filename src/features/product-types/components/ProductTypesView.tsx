"use client";


import {
  Plus,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  FolderTree,
  Trash2,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

import { useProductTypes } from "../hooks/useProductTypes";
import { WorkspaceSummaryCards } from "./WorkspaceSummaryCards";
import { WorkspaceTable, type WorkspaceTrayId } from "./WorkspaceTable";
import { BulkMapDialog } from "./BulkMapDialog";
import { BulkDeleteDialog } from "./BulkDeleteDialog";
import { MergeTypesDialog } from "./MergeTypesDialog";
import { BulkChangeTypeDialog } from "./BulkChangeTypeDialog";
import { ProductTypeFormDialog } from "./ProductTypeFormDialog";
import { ProductTypeDeleteDialog } from "./ProductTypeDeleteDialog";

export function ProductTypesView() {
  const {
    search,
    setSearch,
    activeTray,
    setActiveTray,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    trayItems,
    allTypes,
    workspaceQuery,
    pullMut,
    editing,
    setEditing,
    nameInput,
    setNameInput,
    subInput,
    setSubInput,
    del,
    setDel,
    force,
    setForce,
    subs,
    invalidate,
    saveMut,
    delMut,
    resyncMut,
    openNew,
    openEdit,
    // Modales masivos
    bulkMapOpen,
    setBulkMapOpen,
    bulkMapItems,
    openBulkMap,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    bulkDeleteItems,
    bulkDeleteAllEmpty,
    openBulkDelete,
    mergeOpen,
    setMergeOpen,
    mergeSources,
    openMerge,
    bulkChangeTypeOpen,
    setBulkChangeTypeOpen,
    changeTypeTargetId,
    openBulkChangeType,
  } = useProductTypes();

  const summary = workspaceQuery.data?.summary;

  return (
    <div className="space-y-6">
      {/* Encabezado con Botones de Acción */}
      <PageHeader
        title="Reclasificación de Catálogo"
        description="Bandejas operativas para sincronizar, mapear a subcategorías, fusionar tipos y depurar con BSale."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pullMut.mutate()}
              disabled={pullMut.isPending}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 text-xs"
            >
              {pullMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Jalar desde BSale
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => openBulkChangeType()}
              className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Reclasificar SKUs (Excel)
            </Button>

            <Button size="sm" onClick={openNew} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Nuevo Tipo
            </Button>
          </div>
        }
      />

      {/* Tarjetas KPI de Estado del Catálogo */}
      <WorkspaceSummaryCards
        summary={summary}
        isLoading={workspaceQuery.isLoading}
        activeTray={activeTray}
        onSelectTray={(tray) => setActiveTray(tray as WorkspaceTrayId)}
      />

      {/* Navegación por Bandejas (Tabs) */}
      <div className="flex items-center justify-between border-b border-border pb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTray("unmapped_with_products")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTray === "unmapped_with_products"
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : "text-faint hover:text-fg hover:bg-surface-2"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            Sin Mapear con Productos
            {summary && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono font-semibold">
                {summary.unmapped_with_products_count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTray("unmapped_empty")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTray === "unmapped_empty"
                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                : "text-faint hover:text-fg hover:bg-surface-2"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-400" />
            Sin Mapear Vacíos (Depurables)
            {summary && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono font-semibold">
                {summary.unmapped_empty_count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTray("mapped")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTray === "mapped"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-faint hover:text-fg hover:bg-surface-2"
            }`}
          >
            <FolderTree className="h-3.5 w-3.5 text-primary" />
            Mapeados a Taxonomía
            {summary && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary font-mono font-semibold">
                {summary.mapped_count}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs text-faint">
          {summary ? (
            <span>
              <strong className="text-amber-400">
                {summary.products_without_classification_count} productos sin clasificar
              </strong>
              {summary.naming_mismatches_count > 0 && (
                <span> · {summary.naming_mismatches_count} con alerta de nombre</span>
              )}
            </span>
          ) : null}
        </div>
      </div>

      {/* Tabla Operativa con Selección Múltiple */}
      <WorkspaceTable
        items={trayItems}
        isLoading={workspaceQuery.isLoading || workspaceQuery.isFetching}
        activeTray={activeTray}
        search={search}
        setSearch={setSearch}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onEdit={openEdit}
        onResync={(id) => resyncMut.mutate(id)}
        onDelete={setDel}
        onOpenBulkMap={openBulkMap}
        onOpenBulkDelete={openBulkDelete}
        onOpenMerge={openMerge}
        onOpenMoveProducts={openBulkChangeType}
        invalidate={invalidate}
      />

      {/* Modal: Mapeo Masivo de Tipos */}
      <BulkMapDialog
        open={bulkMapOpen}
        selectedTypes={bulkMapItems}
        subcategories={subs.data}
        subsLoading={subs.isLoading}
        onClose={() => setBulkMapOpen(false)}
        onSuccess={() => {
          invalidate();
          clearSelection();
        }}
      />

      {/* Modal: Eliminación Masiva de Tipos Vacíos */}
      <BulkDeleteDialog
        open={bulkDeleteOpen}
        selectedTypes={bulkDeleteItems}
        deleteAllEmptyUnmapped={bulkDeleteAllEmpty}
        onClose={() => setBulkDeleteOpen(false)}
        onSuccess={() => {
          invalidate();
          clearSelection();
        }}
      />

      {/* Modal: Fusión Masiva de Tipos */}
      <MergeTypesDialog
        open={mergeOpen}
        selectedTypes={mergeSources}
        allTypes={allTypes}
        onClose={() => setMergeOpen(false)}
        onSuccess={() => {
          invalidate();
          clearSelection();
        }}
      />

      {/* Modal: Reclasificación Masiva por SKUs de Excel */}
      <BulkChangeTypeDialog
        open={bulkChangeTypeOpen}
        allTypes={allTypes}
        initialTargetTypeId={changeTypeTargetId}
        onClose={() => setBulkChangeTypeOpen(false)}
        onSuccess={() => {
          invalidate();
        }}
      />

      {/* Modal: Crear / Editar Tipo Individual */}
      <ProductTypeFormDialog
        open={editing !== null}
        isNew={editing === "new"}
        name={nameInput}
        setName={setNameInput}
        sub={subInput}
        setSub={setSubInput}
        subs={subs.data}
        subsLoading={subs.isLoading}
        onClose={() => setEditing(null)}
        onSave={() => saveMut.mutate()}
        saving={saveMut.isPending}
        error={saveMut.error}
      />

      {/* Modal: Eliminar Tipo Individual */}
      <ProductTypeDeleteDialog
        del={del}
        force={force}
        setForce={setForce}
        onClose={() => setDel(null)}
        onDelete={() => delMut.mutate()}
        deleting={delMut.isPending}
        error={delMut.error}
      />
    </div>
  );
}
