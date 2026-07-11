"use client";

import type { Dispatch, SetStateAction } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { useTaxonomia } from "../hooks/useTaxonomia";

type TaxonomiaHook = ReturnType<typeof useTaxonomia>;

export function TaxonomiaImportDialog({
  importOpen,
  setImportOpen,
  importText,
  setImportText,
  importResult,
  setImportResult,
  importMut,
}: {
  importOpen: boolean;
  setImportOpen: Dispatch<SetStateAction<boolean>>;
  importText: string;
  setImportText: Dispatch<SetStateAction<string>>;
  importResult: TaxonomiaHook["importResult"];
  setImportResult: TaxonomiaHook["setImportResult"];
  importMut: TaxonomiaHook["importMut"];
}) {
  return (
    <Dialog
      open={importOpen}
      onClose={() => {
        setImportOpen(false);
        setImportResult(null);
      }}
      title="Importar taxonomía"
      footer={
        !importResult?.ok ? (
          <Button
            onClick={() => importMut.mutate()}
            disabled={importMut.isPending || !importText.trim()}
          >
            <Upload className="h-4 w-4" />
            {importMut.isPending ? "Importando…" : "Importar"}
          </Button>
        ) : null
      }
    >
      {!importResult?.ok ? (
        <>
          <p className="mb-3 text-sm text-muted">
            Pegá el JSON con la taxonomía a importar. La estructura es{" "}
            <code className="rounded bg-surface-3 px-1 text-xs">
              {`{ "Depto": { "Cat": { "Sub": [] } } }`}
            </code>
            . <strong>Solo agrega lo que falta</strong> — no pisa entradas
            existentes ni las que editaste desde la UI.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{ "Cuidado Personal": { "Cabello": { "Shampoos": [] } } }'
            spellCheck={false}
            className="h-64 w-full resize-y rounded-md border border-border-soft bg-surface-2 p-3 font-mono text-xs text-fg focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {importResult && !importResult.ok && (
            <p className="mt-2 text-xs text-danger">{importResult.message}</p>
          )}
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-pill bg-success/15">
            <Upload className="h-6 w-6 text-success" />
          </div>
          <p className="text-body font-semibold text-fg">
            {importResult.message}
          </p>
          {importResult.stats && (
            <ul className="mx-auto mt-3 max-w-xs space-y-1 text-sm text-muted">
              <li>
                <strong>{importResult.stats.departments_inserted}</strong>{" "}
                departamento(s) nuevo(s)
              </li>
              <li>
                <strong>{importResult.stats.categories_inserted}</strong>{" "}
                categoría(s) nueva(s)
              </li>
              <li>
                <strong>{importResult.stats.subcategories_inserted}</strong>{" "}
                subcategoría(s) nueva(s)
              </li>
            </ul>
          )}
          <Button
            className="mt-4"
            variant="ghost"
            onClick={() => {
              setImportOpen(false);
              setImportResult(null);
              setImportText("");
            }}
          >
            Cerrar
          </Button>
        </div>
      )}
    </Dialog>
  );
}
