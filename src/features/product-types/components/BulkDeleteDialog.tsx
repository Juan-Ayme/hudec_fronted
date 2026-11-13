"use client";

import { useState } from "react";
import { AlertOctagon, Check, Eye, Loader2, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bulkDeleteProductTypes } from "@/lib/api";
import { toast } from "@/lib/toast";
import type { ProductType, BulkDeleteProductTypesResponse } from "@/lib/types";

interface BulkDeleteDialogProps {
  open: boolean;
  selectedTypes: ProductType[];
  deleteAllEmptyUnmapped?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkDeleteDialog({
  open,
  selectedTypes,
  deleteAllEmptyUnmapped = false,
  onClose,
  onSuccess,
}: BulkDeleteDialogProps) {
  const [simulation, setSimulation] = useState<BulkDeleteProductTypesResponse | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const resp = await bulkDeleteProductTypes({
        product_type_ids: deleteAllEmptyUnmapped
          ? null
          : selectedTypes.map((t) => t.bsale_product_type_id),
        delete_all_empty_unmapped: deleteAllEmptyUnmapped,
        dry_run: true,
      });
      setSimulation(resp);
      toast.info("Simulación de eliminación completada", {
        description: `${resp.totals.to_delete ?? 0} tipos listos para borrar en BSale y BD.`,
      });
    } catch (err) {
      toast.error("Error al simular eliminación", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const resp = await bulkDeleteProductTypes({
        product_type_ids: deleteAllEmptyUnmapped
          ? null
          : selectedTypes.map((t) => t.bsale_product_type_id),
        delete_all_empty_unmapped: deleteAllEmptyUnmapped,
        dry_run: false,
      });
      toast.success("Eliminación completada", {
        description: `${resp.totals.deleted ?? 0} tipos eliminados en BSale y BD.`,
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Error al eliminar tipos", {
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
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden border-danger/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-4 bg-danger/5">
          <div>
            <h3 className="text-h3 font-bold text-danger flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Eliminar Tipos Vacíos en BSale y BD
            </h3>
            <p className="text-caption text-muted mt-0.5">
              {deleteAllEmptyUnmapped
                ? "Depuración masiva: se eliminarán todos los tipos sin mapear con 0 productos."
                : `Se eliminarán ${selectedTypes.length} tipo(s) seleccionados.`}
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

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-muted flex items-start gap-3">
            <AlertOctagon className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-fg">Protección contra pérdida de datos</p>
              <p className="mt-0.5">
                Cualquier tipo que todavía tenga productos (activos o inactivos) será
                bloqueado automáticamente por el backend para evitar productos huérfanos.
              </p>
            </div>
          </div>

          {!simulation ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-fg">
                Haz clic en <strong>Simular Eliminación</strong> para comprobar cuántos tipos
                cumplen los requisitos antes de borrar.
              </p>
              <Button onClick={handleSimulate} loading={loading}>
                <Eye className="h-4 w-4" /> Simular Eliminación (Dry Run)
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-2/60 p-3 rounded-lg border border-border-soft">
                  <span className="text-faint text-[10px] font-bold uppercase">Listos para borrar</span>
                  <p className="text-xl font-bold text-success">{simulation.totals.to_delete ?? 0}</p>
                </div>
                <div className="bg-surface-2/60 p-3 rounded-lg border border-border-soft">
                  <span className="text-faint text-[10px] font-bold uppercase">Bloqueados con productos</span>
                  <p className="text-xl font-bold text-danger">{simulation.totals.blocked_with_products ?? 0}</p>
                </div>
              </div>

              {/* Bloqueados */}
              {simulation.blocked_with_products && simulation.blocked_with_products.length > 0 && (
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 space-y-2">
                  <p className="text-xs font-bold text-danger uppercase tracking-wider">
                    Tipos bloqueados ({simulation.blocked_with_products.length})
                  </p>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-xs">
                    {simulation.blocked_with_products.map((b) => (
                      <div key={b.bsale_product_type_id} className="p-1.5 rounded bg-surface border border-danger/20">
                        <span className="font-semibold text-fg">{b.name}</span>: {b.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Listos para borrar */}
              {simulation.to_delete && simulation.to_delete.length > 0 && (
                <div className="rounded-lg border border-border-soft bg-surface-2/30 p-3 space-y-2">
                  <p className="text-xs font-bold text-fg uppercase tracking-wider">
                    Tipos que se borrarán ({simulation.to_delete.length})
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
                    {simulation.to_delete.map((d) => (
                      <div key={d.bsale_product_type_id} className="flex items-center justify-between p-1 rounded bg-surface border border-border-soft/50">
                        <span className="font-medium text-fg truncate">{d.name}</span>
                        <span className="font-mono text-faint text-[10px]">#{d.bsale_product_type_id}</span>
                      </div>
                    ))}
                  </div>
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

          {simulation && (simulation.totals.to_delete ?? 0) > 0 && (
            <Button
              onClick={handleExecute}
              loading={loading}
              disabled={loading}
              className="bg-danger text-white hover:bg-danger/90"
            >
              <Trash2 className="h-4 w-4" /> Eliminar Definitivamente ({simulation.totals.to_delete})
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

