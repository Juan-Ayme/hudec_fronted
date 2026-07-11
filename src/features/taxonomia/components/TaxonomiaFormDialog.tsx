"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { LEVEL_LABEL, type FormState } from "../lib";
import type { useTaxonomia } from "../hooks/useTaxonomia";

export function TaxonomiaFormDialog({
  form,
  setForm,
  nameInput,
  setNameInput,
  formMut,
}: {
  form: FormState | null;
  setForm: Dispatch<SetStateAction<FormState | null>>;
  nameInput: string;
  setNameInput: Dispatch<SetStateAction<string>>;
  formMut: ReturnType<typeof useTaxonomia>["formMut"];
}) {
  return (
    <Dialog
      open={form !== null}
      onClose={() => setForm(null)}
      title={
        form?.mode === "create"
          ? `Nueva ${LEVEL_LABEL[form.level]}`
          : `Renombrar ${form ? LEVEL_LABEL[form.level] : ""}`
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => setForm(null)}>
            Cancelar
          </Button>
          <Button
            onClick={() => formMut.mutate()}
            loading={formMut.isPending}
            disabled={!nameInput.trim()}
          >
            {form?.mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </>
      }
    >
      <Input
        autoFocus
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && nameInput.trim()) formMut.mutate();
        }}
        placeholder="Nombre"
        className="w-full"
      />
      {formMut.isError && (
        <p className="mt-2 text-xs text-danger">
          {(formMut.error as Error).message}
        </p>
      )}
    </Dialog>
  );
}
