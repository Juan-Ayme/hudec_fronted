"use client";

import type { Dispatch, SetStateAction } from "react";
import { num } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { LEVEL_LABEL, type DeleteState } from "../lib";
import type { useTaxonomia } from "../hooks/useTaxonomia";

export function TaxonomiaDeleteDialog({
  del,
  setDel,
  force,
  setForce,
  delMut,
}: {
  del: DeleteState | null;
  setDel: Dispatch<SetStateAction<DeleteState | null>>;
  force: boolean;
  setForce: Dispatch<SetStateAction<boolean>>;
  delMut: ReturnType<typeof useTaxonomia>["delMut"];
}) {
  return (
    <Dialog
      open={del !== null}
      onClose={() => setDel(null)}
      title={`Eliminar ${del ? LEVEL_LABEL[del.level] : ""}`}
      description={del ? `"${del.name}"` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={() => setDel(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => delMut.mutate()}
            loading={delMut.isPending}
          >
            Eliminar
          </Button>
        </>
      }
    >
      {del && del.childCount > 0 && (
        <label className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-dim/40 p-3 text-sm">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-fg">
            Tiene {num(del.childCount)}{" "}
            {del.level === "subcategory" ? "productos asociados" : "elementos hijos"}.
            Eliminar en cascada (forzar).
          </span>
        </label>
      )}
      {delMut.isError && (
        <p className="mt-2 text-xs text-danger">
          {(delMut.error as Error).message}
        </p>
      )}
    </Dialog>
  );
}
