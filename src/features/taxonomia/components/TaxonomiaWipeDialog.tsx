"use client";

import type { Dispatch, SetStateAction } from "react";
import { AlertTriangle, Eraser, Upload } from "lucide-react";
import { num } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import type { useTaxonomia } from "../hooks/useTaxonomia";

type TaxonomiaHook = ReturnType<typeof useTaxonomia>;

export function TaxonomiaWipeDialog({
  wipeOpen,
  setWipeOpen,
  wipeConfirm,
  setWipeConfirm,
  wipeResult,
  setWipeResult,
  wipeMut,
  stats,
  activeCompany,
  setImportText,
  setImportResult,
  setImportOpen,
}: {
  wipeOpen: boolean;
  setWipeOpen: Dispatch<SetStateAction<boolean>>;
  wipeConfirm: string;
  setWipeConfirm: Dispatch<SetStateAction<string>>;
  wipeResult: TaxonomiaHook["wipeResult"];
  setWipeResult: TaxonomiaHook["setWipeResult"];
  wipeMut: TaxonomiaHook["wipeMut"];
  stats: TaxonomiaHook["stats"];
  activeCompany: TaxonomiaHook["activeCompany"];
  setImportText: Dispatch<SetStateAction<string>>;
  setImportResult: TaxonomiaHook["setImportResult"];
  setImportOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <Dialog
      open={wipeOpen}
      onClose={() => {
        if (wipeMut.isPending) return;
        setWipeOpen(false);
        setWipeResult(null);
        setWipeConfirm("");
      }}
      title={wipeResult?.ok ? "Taxonomía eliminada" : "Limpiar toda la taxonomía"}
      footer={
        wipeResult?.ok ? null : (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setWipeOpen(false);
                setWipeConfirm("");
              }}
              disabled={wipeMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => wipeMut.mutate()}
              loading={wipeMut.isPending}
              disabled={wipeConfirm !== "LIMPIAR"}
            >
              <Eraser className="h-4 w-4" /> Limpiar todo
            </Button>
          </>
        )
      }
    >
      {!wipeResult?.ok ? (
        <>
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
            <div className="text-fg">
              Vas a borrar <strong>toda</strong> la taxonomía de{" "}
              <strong>{activeCompany?.name ?? "esta empresa"}</strong>. Esta acción
              <strong> no se puede deshacer</strong>. Te recomendamos exportar antes
              por si acaso.
            </div>
          </div>

          <div className="mb-3 rounded-lg border border-border-soft bg-surface-2 p-3 text-sm">
            <p className="mb-2 font-medium text-fg">Qué se va a borrar</p>
            <ul className="space-y-1 text-muted">
              <li>• <strong>{num(stats.deps)}</strong> departamento(s)</li>
              <li>• <strong>{num(stats.cats)}</strong> categoría(s)</li>
              <li>• <strong>{num(stats.subs)}</strong> subcategoría(s)</li>
              <li>• Todas las metas por categoría (category_targets)</li>
            </ul>
            <p className="mb-2 mt-3 font-medium text-fg">Qué NO se toca</p>
            <ul className="space-y-1 text-muted">
              <li>• Productos y variantes (quedarán sin clasificar)</li>
              <li>• Tipos de producto de BSale (quedarán sin mapear)</li>
              <li>• Historial de ventas y documentos</li>
            </ul>
          </div>

          <label className="mb-1 block text-sm text-muted">
            Para confirmar, escribí <code className="rounded bg-surface-3 px-1 text-xs font-mono">LIMPIAR</code>:
          </label>
          <Input
            autoFocus
            value={wipeConfirm}
            onChange={(e) => setWipeConfirm(e.target.value)}
            placeholder="LIMPIAR"
            className="w-full font-mono"
            disabled={wipeMut.isPending}
          />
          {wipeResult && !wipeResult.ok && (
            <p className="mt-2 text-xs text-danger">{wipeResult.message}</p>
          )}
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-pill bg-success/15">
            <Eraser className="h-6 w-6 text-success" />
          </div>
          <p className="text-body font-semibold text-fg">{wipeResult.message}</p>
          {wipeResult.stats && (
            <ul className="mx-auto mt-3 max-w-xs space-y-1 text-left text-sm text-muted">
              <li>• <strong>{num(wipeResult.stats.departments_deleted)}</strong> departamento(s) borrado(s)</li>
              <li>• <strong>{num(wipeResult.stats.categories_deleted)}</strong> categoría(s) borrada(s)</li>
              <li>• <strong>{num(wipeResult.stats.subcategories_deleted)}</strong> subcategoría(s) borrada(s)</li>
              <li>• <strong>{num(wipeResult.stats.products_desclassified)}</strong> producto(s) sin clasificar</li>
              <li>• <strong>{num(wipeResult.stats.product_types_unmapped)}</strong> tipo(s) sin mapear</li>
              {wipeResult.stats.category_targets_deleted > 0 && (
                <li>• <strong>{num(wipeResult.stats.category_targets_deleted)}</strong> meta(s) por categoría borrada(s)</li>
              )}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setWipeOpen(false);
                setWipeResult(null);
                setWipeConfirm("");
              }}
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setWipeOpen(false);
                setWipeResult(null);
                setWipeConfirm("");
                setImportText("");
                setImportResult(null);
                setImportOpen(true);
              }}
            >
              <Upload className="h-4 w-4" /> Importar taxonomía nueva
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
