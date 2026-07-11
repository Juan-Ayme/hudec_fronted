"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useProductTypes } from "../hooks/useProductTypes";
import { ProductTypesFilters } from "./ProductTypesFilters";
import { ProductTypesTable } from "./ProductTypesTable";
import { ProductTypeFormDialog } from "./ProductTypeFormDialog";
import { ProductTypeDeleteDialog } from "./ProductTypeDeleteDialog";

export function ProductTypesView() {
  const {
    search,
    setSearch,
    toggle,
    setToggle,
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
    pts,
    subs,
    invalidate,
    saveMut,
    delMut,
    resyncMut,
    openNew,
    openEdit,
  } = useProductTypes();

  return (
    <div>
      <PageHeader
        title="Product Types"
        description="Tipos de producto de BSale y su mapeo a la taxonomía. Crear, renombrar y eliminar escriben en BSale."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Nuevo
          </Button>
        }
      />

      <ProductTypesFilters
        search={search}
        setSearch={setSearch}
        toggle={toggle}
        setToggle={setToggle}
      />

      <ProductTypesTable
        data={pts.data}
        isLoading={pts.isLoading || pts.isFetching}
        error={pts.error}
        onEdit={openEdit}
        onResync={(id) => resyncMut.mutate(id)}
        onDelete={setDel}
        invalidate={invalidate}
      />

      {/* Crear / editar */}
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

      {/* Eliminar */}
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
