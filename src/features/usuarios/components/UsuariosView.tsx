"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import { useUsuarios } from "../hooks/useUsuarios";
import { UsuariosSkeleton } from "./UsuariosSkeleton";
import { UsuariosTable } from "./UsuariosTable";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserDialog } from "./DeleteUserDialog";

export function UsuariosView() {
  const {
    query,
    createOpen,
    setCreateOpen,
    editUser,
    setEditUser,
    deleteUserObj,
    setDeleteUserObj,
    createMut,
    updateMut,
    deleteMut,
  } = useUsuarios();

  if (query.isError) return <ErrorState error={query.error} />;

  const users = query.data?.users || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        description="Crear, editar y eliminar usuarios. Asignar roles de acceso."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        }
      />

      {query.isLoading ? (
        <UsuariosSkeleton />
      ) : (
        <UsuariosTable
          users={users}
          onEdit={setEditUser}
          onDelete={setDeleteUserObj}
        />
      )}

      {/* CREATE MODAL */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => createMut.mutate(data)}
        isPending={createMut.isPending}
        error={createMut.error}
      />

      {/* EDIT MODAL */}
      {editUser && (
        <EditUserModal
          user={editUser}
          open={!!editUser}
          onClose={() => setEditUser(null)}
          onSubmit={(data) => updateMut.mutate({ id: editUser.id, body: data })}
          isPending={updateMut.isPending}
          error={updateMut.error}
        />
      )}

      {/* DELETE MODAL */}
      {deleteUserObj && (
        <DeleteUserDialog
          user={deleteUserObj}
          onClose={() => setDeleteUserObj(null)}
          onDelete={() => deleteMut.mutate(deleteUserObj.id)}
          deleting={deleteMut.isPending}
          error={deleteMut.error}
        />
      )}
    </div>
  );
}
