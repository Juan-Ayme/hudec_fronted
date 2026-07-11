"use client";

import type { AuthUserDetailed } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/** Diálogo de confirmación para eliminar un usuario. */
export function DeleteUserDialog({
  user,
  onClose,
  onDelete,
  deleting,
  error,
}: {
  user: AuthUserDetailed;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
  error: Error | null;
}) {
  return (
    <Dialog
      open={!!user}
      onClose={onClose}
      title="Eliminar usuario"
      description={`¿Estás seguro de que deseas eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="danger"
            onClick={onDelete}
            loading={deleting}
          >
            Eliminar
          </Button>
        </>
      }
    >
      {error && (
        <p className="text-danger text-sm mt-2 mb-4">
          Error: {error.message}
        </p>
      )}
    </Dialog>
  );
}
