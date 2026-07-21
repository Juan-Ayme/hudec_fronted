"use client";

import { Download, Eraser, Plus, Search, Upload } from "lucide-react";
import { num } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useTaxonomia } from "../hooks/useTaxonomia";
import { useCompany } from "@/components/company-context";
import { TaxonomiaTree } from "./TaxonomiaTree";
import { TaxonomiaFormDialog } from "./TaxonomiaFormDialog";
import { TaxonomiaDeleteDialog } from "./TaxonomiaDeleteDialog";
import { TaxonomiaWipeDialog } from "./TaxonomiaWipeDialog";
import { TaxonomiaImportDialog } from "./TaxonomiaImportDialog";

export function TaxonomiaView() {
  const {
    tree,
    departments,
    filteredDepartments,
    stats,
    activeCompany,
    expanded,
    toggle,
    searchQuery,
    setSearchQuery,
    handleExport,
    openCreate,
    openRename,
    openDelete,
    form,
    setForm,
    nameInput,
    setNameInput,
    formMut,
    del,
    setDel,
    force,
    setForce,
    delMut,
    importOpen,
    setImportOpen,
    importText,
    setImportText,
    importResult,
    setImportResult,
    importMut,
    wipeOpen,
    setWipeOpen,
    wipeConfirm,
    setWipeConfirm,
    wipeResult,
    setWipeResult,
    wipeMut,
  } = useTaxonomia();

  const { activeRole } = useCompany();
  const readOnly = activeRole === "viewer" || activeRole === null;

  return (
    <div>
      <PageHeader
        title="Taxonomía"
        description="Jerarquía interna Departamento → Categoría → Subcategoría. Vive solo en tu base de datos (no en BSale)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={handleExport} title="Descargar el árbol actual como JSON">
              <Download className="h-4 w-4" /> Exportar
            </Button>
            {!readOnly && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setImportText("");
                    setImportResult(null);
                    setImportOpen(true);
                  }}
                  title="Pegar un JSON e importar los deptos/categorías/subcategorías que falten"
                >
                  <Upload className="h-4 w-4" /> Importar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setWipeConfirm("");
                    setWipeResult(null);
                    setWipeOpen(true);
                    wipeMut.reset();
                  }}
                  disabled={stats.deps === 0}
                  title="Borrar TODA la taxonomía y empezar desde cero"
                >
                  <Eraser className="h-4 w-4" /> Limpiar todo
                </Button>
                <Button onClick={() => openCreate("department")}>
                  <Plus className="h-4 w-4" /> Departamento
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Badge tone="primary">{num(stats.deps)} departamentos</Badge>
        <Badge tone="info">{num(stats.cats)} categorías</Badge>
        <Badge tone="violet">{num(stats.subs)} subcategorías</Badge>
        <Badge tone="neutral">{num(stats.prods)} productos clasificados</Badge>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
        <Input
          placeholder="Buscar departamento, categoría o subcategoría..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      <Card className="p-2">
        {tree.isLoading ? (
          <LoadingState />
        ) : tree.error ? (
          <ErrorState error={tree.error} />
        ) : departments.length === 0 ? (
          <EmptyState
            title="Taxonomía vacía"
            hint="Crea el primer departamento para empezar."
          />
        ) : filteredDepartments.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            hint={`No se encontró nada para "${searchQuery}".`}
          />
        ) : (
          <TaxonomiaTree
            filteredDepartments={filteredDepartments}
            searchQuery={searchQuery}
            expanded={expanded}
            toggle={toggle}
            openCreate={openCreate}
            openRename={openRename}
            openDelete={openDelete}
            readOnly={readOnly}
          />
        )}
      </Card>

      {/* Crear / Renombrar */}
      <TaxonomiaFormDialog
        form={form}
        setForm={setForm}
        nameInput={nameInput}
        setNameInput={setNameInput}
        formMut={formMut}
      />

      {/* Eliminar */}
      <TaxonomiaDeleteDialog
        del={del}
        setDel={setDel}
        force={force}
        setForce={setForce}
        delMut={delMut}
      />

      {/* ─────────── WIPE MODAL ─────────── */}
      <TaxonomiaWipeDialog
        wipeOpen={wipeOpen}
        setWipeOpen={setWipeOpen}
        wipeConfirm={wipeConfirm}
        setWipeConfirm={setWipeConfirm}
        wipeResult={wipeResult}
        setWipeResult={setWipeResult}
        wipeMut={wipeMut}
        stats={stats}
        activeCompany={activeCompany}
        setImportText={setImportText}
        setImportResult={setImportResult}
        setImportOpen={setImportOpen}
      />

      {/* ─────────── IMPORT MODAL ─────────── */}
      <TaxonomiaImportDialog
        importOpen={importOpen}
        setImportOpen={setImportOpen}
        importText={importText}
        setImportText={setImportText}
        importResult={importResult}
        setImportResult={setImportResult}
        importMut={importMut}
      />
    </div>
  );
}
