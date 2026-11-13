"use client";

import { useState, useMemo } from "react";
import { ArrowRight, Check, Eye, FileSpreadsheet, Loader2, Sparkles, X, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bulkChangeProductType } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { ProductType, BulkChangeProductTypeResponse } from "@/lib/types";

interface BulkChangeTypeDialogProps {
  open: boolean;
  allTypes: ProductType[];
  initialTargetTypeId?: number;
  initialProductIds?: number[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkChangeTypeDialog({
  open,
  allTypes,
  initialTargetTypeId,
  initialProductIds,
  onClose,
  onSuccess,
}: BulkChangeTypeDialogProps) {
  const [targetId, setTargetId] = useState<string>(
    initialTargetTypeId ? String(initialTargetTypeId) : ""
  );
  const [skuText, setSkuText] = useState<string>("");
  const [clearOverrides, setClearOverrides] = useState<boolean>(true);
  const [searchTarget, setSearchTarget] = useState("");
  const [simulation, setSimulation] = useState<BulkChangeProductTypeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Parse SKUs from text (separated by commas, spaces, or newlines)
  const parsedSkus = useMemo(() => {
    if (!skuText.trim()) return [];
    return skuText
      .split(/[\r\n,\t]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [skuText]);

  // Candidatos para tipo destino: activos en BSale
  const activeTypes = useMemo(() => {
    return allTypes.filter((t) => t.is_active);
  }, [allTypes]);

  const filteredCandidates = useMemo(() => {
    if (!searchTarget.trim()) return activeTypes;
    const q = searchTarget.toLowerCase();
    return activeTypes.filter((t) =>
      t.name.toLowerCase().includes(q) || String(t.bsale_product_type_id).includes(q)
    );
  }, [activeTypes, searchTarget]);

  const selectedTarget = useMemo(
    () => allTypes.find((t) => String(t.bsale_product_type_id) === targetId),
    [allTypes, targetId]
  );

  if (!open) return null;

  const hasInputs = parsedSkus.length > 0 || (initialProductIds && initialProductIds.length > 0);

  const handleSimulate = async () => {
    if (!targetId) {
      toast.error("Selecciona el tipo de producto destino");
      return;
    }
    if (!hasInputs) {
      toast.error("Pega al menos un SKU o código de barra desde Excel");
      return;
    }

    setLoading(true);
    try {
      const resp = await bulkChangeProductType({
        target_product_type_id: Number(targetId),
        skus: parsedSkus.length > 0 ? parsedSkus : undefined,
        product_ids: initialProductIds && initialProductIds.length > 0 ? initialProductIds : undefined,
        clear_overrides: clearOverrides,
        dry_run: true,
      });

      setSimulation(resp);
      toast.info("Simulación de cambio de tipo completada", {
        description: `Coincidieron ${resp.totals.matched_products} productos (${resp.totals.to_move ?? 0} listos para mover).`,
      });
    } catch (err) {
      toast.error("Error al simular cambio de tipo", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!targetId || !hasInputs) return;

    setLoading(true);
    try {
      const resp = await bulkChangeProductType({
        target_product_type_id: Number(targetId),
        skus: parsedSkus.length > 0 ? parsedSkus : undefined,
        product_ids: initialProductIds && initialProductIds.length > 0 ? initialProductIds : undefined,
        clear_overrides: clearOverrides,
        dry_run: false,
      });

      toast.success("Productos reasignados con éxito", {
        description: `${resp.totals.moved ?? 0} productos actualizados a "${resp.target_product_type.name}".`,
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Error al ejecutar cambio de tipo", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl bg-[#0f172a] border-[#1e293b] text-slate-100 shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Mover Productos a otro Tipo
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pega SKUs o códigos de barra desde Excel para cambiar el Tipo de Producto en BSale y BD.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Textarea para pegar SKUs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Pega la columna de SKUs o Códigos de Barra (desde Excel)
              </label>
              <span className="text-[11px] text-slate-400">
                {parsedSkus.length} SKUs identificados
              </span>
            </div>
            <textarea
              rows={4}
              value={skuText}
              onChange={(e) => {
                setSkuText(e.target.value);
                setSimulation(null);
              }}
              placeholder={`Ejemplo:\nSKU-10023\nSKU-10024\n7751234567890\nSKU-10055`}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Selector de Tipo Destino */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tipo de Producto Destino <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Buscar tipo destino por nombre o ID..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-2"
            />
            <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-md bg-slate-950/40 divide-y divide-slate-800/60">
              {filteredCandidates.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  No se encontraron tipos activos disponibles
                </div>
              ) : (
                filteredCandidates.map((t) => {
                  const isSelected = String(t.bsale_product_type_id) === targetId;
                  return (
                    <button
                      key={t.bsale_product_type_id}
                      type="button"
                      onClick={() => {
                        setTargetId(String(t.bsale_product_type_id));
                        setSimulation(null);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                        isSelected
                          ? "bg-emerald-600/20 text-emerald-200"
                          : "hover:bg-slate-800/50 text-slate-300"
                      }`}
                    >
                      <div>
                        <span className="text-slate-500 mr-2">#{t.bsale_product_type_id}</span>
                        <span className="font-medium text-white">{t.name}</span>
                        {t.is_mapped && (
                          <span className="ml-2 text-[10px] text-emerald-400">
                            • {t.department} / {t.category} / {t.subcategory}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {(t.productos_activos ?? 0) + (t.productos_inactivos ?? 0)} prods
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-emerald-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {selectedTarget && (
              <p className="text-xs text-emerald-300 mt-1 flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5" />
                Destino elegido: <strong className="text-white">{selectedTarget.name}</strong> (ID {selectedTarget.bsale_product_type_id})
              </p>
            )}
          </div>

          {/* Opciones */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={clearOverrides}
                onChange={(e) => {
                  setClearOverrides(e.target.checked);
                  setSimulation(null);
                }}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
              />
              <span>
                Limpiar excepciones de subcategoría en los productos movidos (recomendado para que adopten la taxonomía del nuevo tipo)
              </span>
            </label>
          </div>

          {/* Informe de Simulación */}
          {simulation && (
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> Simulación de Reclasificación
                </span>
                <Badge tone="success" className="border-emerald-500/40 text-emerald-300 text-[10px]">
                  dry_run: true
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-base font-bold text-white">
                    {simulation.totals.matched_products}
                  </div>
                  <div className="text-[10px] text-slate-400">Coincidentes</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-base font-bold text-emerald-400">
                    {simulation.totals.to_move ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Listos para mover</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-base font-bold text-slate-300">
                    {simulation.totals.already_in_target}
                  </div>
                  <div className="text-[10px] text-slate-400">Ya en destino</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-base font-bold text-amber-400">
                    {simulation.totals.not_found_count}
                  </div>
                  <div className="text-[10px] text-slate-400">No encontrados</div>
                </div>
              </div>

              {simulation.to_move && simulation.to_move.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Productos que cambiarán de tipo:
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {simulation.to_move.slice(0, 5).map((p) => (
                      <div
                        key={p.bsale_product_id}
                        className="text-xs px-2 py-1 bg-slate-900/80 rounded flex items-center justify-between text-slate-300"
                      >
                        <div className="truncate max-w-[320px]">
                          <span className="font-medium text-white">{p.product_name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({p.current_product_type_name || "Sin Tipo"} → {simulation.target_product_type.name})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">#{p.bsale_product_id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {simulation.not_found.skus.length > 0 && (
                <div className="p-2 bg-amber-950/20 border border-amber-500/20 rounded text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-medium">SKUs no encontrados en el catálogo:</span>{" "}
                    {simulation.not_found.skus.slice(0, 10).join(", ")}
                    {simulation.not_found.skus.length > 10 && "..."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            {!simulation ? (
              <Button
                variant="outline"
                onClick={handleSimulate}
                disabled={loading || !targetId || !hasInputs}
                className="text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                Simular Reclasificación
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleSimulate}
                  disabled={loading}
                  className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 gap-1.5"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Volver a Simular
                </Button>
                <Button
                  onClick={handleExecute}
                  disabled={loading || (simulation.totals.to_move ?? 0) === 0}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Mover {simulation.totals.to_move ?? 0} Productos
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

