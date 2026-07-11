"use client";

import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import type { Subcategory } from "@/lib/types";

/** Diálogo de crear / editar product type. */
export function ProductTypeFormDialog({
  open,
  isNew,
  name,
  setName,
  sub,
  setSub,
  subs,
  subsLoading,
  onClose,
  onSave,
  saving,
  error,
}: {
  open: boolean;
  isNew: boolean;
  name: string;
  setName: (v: string) => void;
  sub: string;
  setSub: (v: string) => void;
  subs: Subcategory[] | undefined;
  subsLoading: boolean;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: Error | null;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isNew ? "Nuevo product type" : "Editar product type"}
      description="El nombre se crea/edita en BSale; el mapeo solo en tu BD."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            loading={saving}
            disabled={!name.trim()}
          >
            {isNew ? "Crear" : "Guardar"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Nombre">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Dulces / Chocolates"
            className="w-full"
          />
        </Field>
        <Field label="Mapear a subcategoría">
          <Select
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            disabled={subsLoading}
          >
            <option value="">— Sin mapear —</option>
            {(subs ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.department_name} / {s.category_name} / {s.name}
              </option>
            ))}
          </Select>
        </Field>
        {error && (
          <p className="text-xs text-danger">
            {error.message}
          </p>
        )}
      </div>
    </Dialog>
  );
}
