"use client";

import { useState } from "react";
import { ArrowRight, Check, Eye, Layers, Loader2, Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bulkMapProductTypes } from "@/lib/api";
import { toast } from "@/lib/toast";
import type {
  ProductType,
  Subcategory,
  BulkMapProductTypesResponse,
} from "@/lib/types";

interface BulkMapDialogProps {
  open: boolean;
  selectedTypes: ProductType[];
  subcategories: Subcategory[] | undefined;
  subsLoading: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkMapDialog({
  open,
  selectedTypes,
  subcategories = [],
  subsLoading,
  onClose,
  onSuccess,
}: BulkMapDialogProps) {
  const [subId, setSubId] = useState<string>("");
  const [renameInBsale, setRenameInBsale] = useState(true);
  const [searchSub, setSearchSub] = useState("");
  const [simulation, setSimulation] = useState<BulkMapProductTypesResponse | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const filteredSubs = subcategories.filter((s) => {
    const text = `${s.name} ${s.category_name ?? ""} ${s.department_name ?? ""}`.toLowerCase();
    return text.includes(searchSub.toLowerCase());
  });

  const selectedSub = subcategories.find((s) => String(s.id) === subId);
  const targetExpectedName = selectedSub
    ? `${selectedSub.category_name ?? ""} / ${selectedSub.name}`
    : "";

  const handleSimulate = async () => {
    if (!subId) {
      toast.error("Selecciona una subcategoría destino");
      return;
    }
    setLoading(true);
    try {
      const resp = await bulkMapProductTypes({
        product_type_ids: selectedTypes.map((t) => t.bsale_product_type_id),
        subcategory_id: Number(subId),
        rename_in_bsale: renameInBsale,
        dry_run: true,
      });
      setSimulation(resp);
      toast.info("Simulación completada", {
        description: `Se detectaron ${resp.totals.to_update} tipos listos para mapear.`,
      });
    } catch (err) {
      toast.error("Error al simular mapeo", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!subId) return;
    setLoading(true);
    try {
      const resp = await bulkMapProductTypes({
        product_type_ids: selectedTypes.map((t) => t.bsale_product_type_id),
        subcategory_id: Number(subId),
        rename_in_bsale: renameInBsale,
        dry_run: false,
      });
      toast.success("Mapeo aplicado con éxito", {
        description: `${resp.totals.updated} tipos mapeados en BD${
          resp.totals.renamed_in_bsale
            ? ` y ${resp.totals.renamed_in_bsale} renombrados en BSale.`
            : "."
        }`,
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Error al aplicar mapeo", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
          <div>
            <h3 className="text-h3 font-bold text-fg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Mapeo Masivo a Subcategoría
            </h3>
            <p className="text-caption text-muted mt-0.5">
              Asigna {selectedTypes.length} tipo{selectedTypes.length === 1 ? "" : "s"} de producto a una subcategoría de la taxonomía.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Tipos seleccionados */}
          <div>
            <p className="text-xs font-semibold text-fg uppercase tracking-wider mb-2">
              Tipos a mapear ({selectedTypes.length})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto rounded-lg border border-border-soft bg-surface-2/40 p-2.5">
              {selectedTypes.map((t) => (
                <span
                  key={t.bsale_product_type_id}
                  className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs font-medium text-fg border border-border-soft"
                >
                  <span className="font-mono text-faint text-[10px]">#{t.bsale_product_type_id}</span>
                  {t.name}
                  {t.productos > 0 && (
                    <span className="text-[10px] text-muted">({t.productos} prods)</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Selector de subcategoría */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-fg uppercase tracking-wider">
              Subcategoría Destino
            </label>
            <input
              type="text"
              placeholder="Buscar por departamento, categoría o subcategoría..."
              value={searchSub}
              onChange={(e) => setSearchSub(e.target.value)}
              className="w-full rounded-lg border border-border-soft bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border-soft bg-surface divide-y divide-border-soft/60">
              {subsLoading ? (
                <div className="p-4 text-center text-xs text-muted">Cargando subcategorías...</div>
              ) : filteredSubs.length === 0 ? (
                <div className="p-4 text-center text-xs text-faint">No se encontraron subcategorías</div>
              ) : (
                filteredSubs.map((s) => {
                  const isSel = String(s.id) === subId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSubId(String(s.id));
                        setSimulation(null); // Resetea simulación si cambia
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        isSel ? "bg-primary/15 text-primary font-semibold" : "hover:bg-surface-2 text-fg"
                      }`}
                    >
                      <div>
                        <span>{s.name}</span>
                        <span className="text-faint font-normal text-[11px] ml-1.5">
                          · {s.department_name ?? ""} / {s.category_name ?? ""}
                        </span>
                      </div>
                      {isSel && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Opción renombrar en BSale */}
          <div className="rounded-xl border border-border-soft bg-surface-2/30 p-3.5 space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={renameInBsale}
                onChange={(e) => {
                  setRenameInBsale(e.target.checked);
                  setSimulation(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-border-soft text-primary focus:ring-primary"
              />
              <div className="text-xs">
                <span className="font-semibold text-fg">
                  Estandarizar nombre en BSale automáticamente
                </span>
                <p className="text-muted mt-0.5">
                  Renombra en BSale a la convención oficial:{" "}
                  <code className="bg-surface px-1.5 py-0.5 rounded font-mono text-primary text-[11px]">
                    {targetExpectedName || "Categoría / Subcategoría"}
                  </code>
                </p>
              </div>
            </label>
          </div>

          {/* Previsualización de simulación */}
          {simulation && (
            <div className="rounded-xl border border-info/30 bg-info/5 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-info uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Previsualización (Dry Run)
                </span>
                <Badge tone="info">Listo para aplicar</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface/80 p-2.5 rounded border border-border-soft">
                  <span className="text-faint text-[10px] uppercase font-bold">A Mapear</span>
                  <p className="text-body font-bold text-fg">{simulation.totals.to_update ?? 0} tipos</p>
                </div>
                <div className="bg-surface/80 p-2.5 rounded border border-border-soft">
                  <span className="text-faint text-[10px] uppercase font-bold">Destino</span>
                  <p className="text-caption font-semibold text-primary truncate">
                    {simulation.target_subcategory?.category} / {simulation.target_subcategory?.subcategory}
                  </p>
                </div>
              </div>

              {simulation.to_update && simulation.to_update.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {simulation.to_update.map((item) => (
                    <div
                      key={item.bsale_product_type_id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded bg-surface/60 border border-border-soft/40 text-[11px]"
                    >
                      <span className="text-fg font-medium truncate">{item.current_name}</span>
                      {item.current_name !== item.new_name && (
                        <div className="flex items-center gap-1 shrink-0 text-success font-mono">
                          <ArrowRight className="h-3 w-3" />
                          <span>{item.new_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border-soft px-6 py-4 bg-surface-2/40">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          {!simulation ? (
            <Button
              onClick={handleSimulate}
              loading={loading}
              disabled={loading || !subId || selectedTypes.length === 0}
            >
              <Eye className="h-4 w-4" /> Simular Mapeo
            </Button>
          ) : (
            <Button
              onClick={handleExecute}
              loading={loading}
              disabled={loading}
              className="bg-primary text-primary-fg hover:bg-primary/90"
            >
              <Check className="h-4 w-4" /> Confirmar y Aplicar en BSale
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

