"use client";

import { useState, useMemo } from "react";
import { GitMerge, ArrowRight, Check, Eye, Loader2, AlertTriangle, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mergeProductTypes } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { ProductType, MergeProductTypesResponse } from "@/lib/types";

interface MergeTypesDialogProps {
  open: boolean;
  selectedTypes: ProductType[];
  allTypes: ProductType[];
  onClose: () => void;
  onSuccess: () => void;
}

export function MergeTypesDialog({
  open,
  selectedTypes,
  allTypes,
  onClose,
  onSuccess,
}: MergeTypesDialogProps) {
  const [targetId, setTargetId] = useState<string>("");
  const [deleteSourcesAfter, setDeleteSourcesAfter] = useState(true);
  const [copyMappingIfTargetUnmapped, setCopyMappingIfTargetUnmapped] = useState(true);
  const [clearProductOverrides, setClearProductOverrides] = useState(true);
  const [searchTarget, setSearchTarget] = useState("");
  const [simulation, setSimulation] = useState<MergeProductTypesResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Tipos origen seleccionados (IDs)
  const sourceIds = useMemo(
    () => selectedTypes.map((t) => t.bsale_product_type_id),
    [selectedTypes]
  );

  // Candidatos para tipo destino: activos en BSale y que NO sean uno de los orígenes seleccionados
  const candidateTargets = useMemo(() => {
    return allTypes.filter(
      (t) => t.is_active && !sourceIds.includes(t.bsale_product_type_id)
    );
  }, [allTypes, sourceIds]);

  const filteredCandidates = useMemo(() => {
    if (!searchTarget.trim()) return candidateTargets;
    const q = searchTarget.toLowerCase();
    return candidateTargets.filter((t) =>
      t.name.toLowerCase().includes(q) || String(t.bsale_product_type_id).includes(q)
    );
  }, [candidateTargets, searchTarget]);

  const selectedTarget = useMemo(
    () => allTypes.find((t) => String(t.bsale_product_type_id) === targetId),
    [allTypes, targetId]
  );

  if (!open) return null;

  const handleSimulate = async () => {
    if (!targetId) {
      toast.error("Selecciona un tipo de producto destino");
      return;
    }
    if (sourceIds.length === 0) {
      toast.error("Debes seleccionar al menos un tipo origen para fusionar");
      return;
    }

    setLoading(true);
    try {
      const resp = await mergeProductTypes({
        source_product_type_ids: sourceIds,
        target_product_type_id: Number(targetId),
        delete_sources_after: deleteSourcesAfter,
        copy_mapping_if_target_unmapped: copyMappingIfTargetUnmapped,
        clear_product_overrides: clearProductOverrides,
        dry_run: true,
      });
      setSimulation(resp);
      toast.info("Simulación de fusión completada", {
        description: `Se moverán ${resp.totals.products_to_move ?? 0} productos a "${resp.target?.name}".`,
      });
    } catch (err) {
      toast.error("Error al simular fusión", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!targetId || sourceIds.length === 0) return;

    setLoading(true);
    try {
      const resp = await mergeProductTypes({
        source_product_type_ids: sourceIds,
        target_product_type_id: Number(targetId),
        delete_sources_after: deleteSourcesAfter,
        copy_mapping_if_target_unmapped: copyMappingIfTargetUnmapped,
        clear_product_overrides: clearProductOverrides,
        dry_run: false,
      });

      toast.success("Fusión ejecutada exitosamente", {
        description: `${resp.totals.products_moved ?? 0} productos movidos y ${
          resp.totals.sources_deleted ?? 0
        } tipos obsoletos eliminados.`,
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Error al ejecutar fusión", {
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
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Fusionar Tipos de Producto
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mueve todos los productos de los tipos seleccionados hacia un tipo destino en BSale y BD.
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
          {/* Tipos Origen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">
                Tipos Origen a Fusionar ({selectedTypes.length})
              </span>
              <span className="text-xs text-slate-500">
                Total productos:{" "}
                {selectedTypes.reduce(
                  (acc, t) => acc + (t.productos_activos ?? 0) + (t.productos_inactivos ?? 0),
                  0
                )}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 max-h-28 overflow-y-auto">
              {selectedTypes.map((t) => (
                <Badge
                  key={t.bsale_product_type_id}
                  tone="neutral"
                  className="bg-slate-800/80 border-slate-700 text-slate-200 text-xs py-1"
                >
                  <span className="text-slate-400 mr-1">#{t.bsale_product_type_id}</span>
                  {t.name}
                  <span className="ml-1.5 px-1.5 py-0.2 bg-slate-700/60 rounded text-[10px] text-slate-300">
                    {(t.productos_activos ?? 0) + (t.productos_inactivos ?? 0)} prods
                  </span>
                </Badge>
              ))}
            </div>
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
              className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-2"
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
                          ? "bg-indigo-600/20 text-indigo-200"
                          : "hover:bg-slate-800/50 text-slate-300"
                      }`}
                    >
                      <div>
                        <span className="text-slate-500 mr-2">#{t.bsale_product_type_id}</span>
                        <span className="font-medium text-white">{t.name}</span>
                        {t.is_mapped && (
                          <span className="ml-2 text-[10px] text-emerald-400">
                            • Mapeado a: {t.department} / {t.category} / {t.subcategory}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {(t.productos_activos ?? 0) + (t.productos_inactivos ?? 0)} prods
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-indigo-400" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {selectedTarget && (
              <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5" />
                Destino elegido: <strong className="text-white">{selectedTarget.name}</strong> (ID {selectedTarget.bsale_product_type_id})
              </p>
            )}
          </div>

          {/* Opciones Avanzadas */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Comportamiento de la Fusión
            </span>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={deleteSourcesAfter}
                onChange={(e) => {
                  setDeleteSourcesAfter(e.target.checked);
                  setSimulation(null);
                }}
                className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
              />
              <span>
                Eliminar tipos origen en BSale y BD una vez vacíos (<Trash2 className="inline h-3 w-3 text-rose-400" /> recomendado)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={copyMappingIfTargetUnmapped}
                onChange={(e) => {
                  setCopyMappingIfTargetUnmapped(e.target.checked);
                  setSimulation(null);
                }}
                className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
              />
              <span>
                Copiar subcategoría al destino si el destino no está mapeado aún
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={clearProductOverrides}
                onChange={(e) => {
                  setClearProductOverrides(e.target.checked);
                  setSimulation(null);
                }}
                className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
              />
              <span>
                Limpiar excepciones individuales de productos para heredar la subcategoría del tipo destino
              </span>
            </label>
          </div>

          {/* Informe de Simulación */}
          {simulation && (
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> Vista Previa (Simulación Segura)
                </span>
                <Badge tone="violet" className="border-indigo-500/40 text-indigo-300 text-[10px]">
                  dry_run: true
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-base font-bold text-white">
                    {simulation.totals.products_to_move ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Productos a mover</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-base font-bold text-emerald-400">
                    {simulation.totals.active_products_to_move ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Activos en BSale</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                  <div className="text-base font-bold text-rose-400">
                    {simulation.totals.will_delete_sources
                      ? simulation.sources?.length ?? 0
                      : 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Tipos a eliminar</div>
                </div>
              </div>

              {simulation.sample_products && simulation.sample_products.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Muestra de productos que serán reasignados:
                  </span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {simulation.sample_products.slice(0, 5).map((p) => (
                      <div
                        key={p.bsale_product_id}
                        className="text-xs px-2 py-1 bg-slate-900/80 rounded flex items-center justify-between text-slate-300"
                      >
                        <span className="truncate max-w-[340px]">{p.name}</span>
                        <span className="text-[10px] text-slate-500">#{p.bsale_product_id}</span>
                      </div>
                    ))}
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
                disabled={loading || !targetId || sourceIds.length === 0}
                className="text-xs border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                Simular Fusión
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
                  disabled={loading}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <GitMerge className="h-3.5 w-3.5" />
                  )}
                  Ejecutar Fusión Definitiva
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

