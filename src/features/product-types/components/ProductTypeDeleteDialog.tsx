"use client";

import { num } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ProductType } from "@/lib/types";

/** Diálogo de eliminación de un product type. */
export function ProductTypeDeleteDialog({
  del,
  force,
  setForce,
  onClose,
  onDelete,
  deleting,
  error,
}: {
  del: ProductType | null;
  force: boolean;
  setForce: (v: boolean) => void;
  onClose: () => void;
  onDelete: () => void;
  deleting: boolean;
  error: Error | null;
}) {
  return (
    <Dialog
      open={del !== null}
      onClose={onClose}
      title="Eliminar product type"
      description={del ? `"${del.name}" — se eliminará en BSale y tu BD.` : ""}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
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
      {del && del.productos > 0 && (
        <label className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-dim/40 p-3 text-sm">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-fg">
            Tiene {num(del.productos)} productos. Forzar (BSale puede rechazar
            si hay productos vivos).
          </span>
        </label>
      )}
      {error && (
        <p className="mt-2 text-xs text-danger">
          {error.message}
        </p>
      )}
    </Dialog>
  );
}
