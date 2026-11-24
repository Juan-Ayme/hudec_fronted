"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  comprasCatalogoExcelUrl,
  downloadExcelFile,
  matrixExcelUrl,
} from "@/lib/api";

/**
 * ExportMenu — descargas operativas del Centro de Catálogo:
 * matriz de ventas 04b (90d) y catálogo completo de la sucursal.
 * Los informes gerenciales viven ahora en /informes.
 */
export function ExportMenu({
  sucursalName,
  officeId,
  canVerRendimiento,
}: {
  sucursalName: string | null;
  officeId: number | null;
  canVerRendimiento: boolean;
}) {
  const [open, setOpen] = useState(false);
  const comprasDisabled = officeId == null;

  return (
    <div className="relative shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        title="Exportar Excel"
        className={cn(
          "h-8 gap-1.5 rounded-full px-3 text-xs font-medium shadow-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95]",
          open
            ? "bg-primary/15 border-primary/20 text-primary hover:bg-primary/20"
            : "bg-surface-2 border-border-soft text-muted hover:text-fg hover:bg-surface-3 hover:border-border",
        )}
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Exportar</span>
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[320px] z-50 flex flex-col rounded-3xl border border-white/10 bg-surface/70 backdrop-blur-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] animate-[fade-in-up_var(--duration-fast)_var(--ease-premium)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 bg-transparent">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Download className="h-4 w-4 text-white/70" /> Exportar Catálogo
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-[0.85] text-white/60 hover:text-white transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar space-y-1">
              {canVerRendimiento && (
                <button
                  onClick={() => {
                    downloadExcelFile(
                      matrixExcelUrl("04b", { sucursal: sucursalName ?? undefined }),
                      "ventas_jerarquicas.xlsx",
                    ).catch(console.error);
                    setOpen(false);
                  }}
                  className="w-full text-left flex flex-col items-start px-3 py-2 rounded-xl hover:bg-white/10 active:bg-white/15 active:scale-[0.96] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#30d158]" />
                    <span className="font-semibold text-white">Matriz de Ventas (90d)</span>
                  </div>
                  <span className="text-[10px] text-white/50 mt-0.5">
                    Catálogo con métricas jerárquicas{sucursalName ? ` · ${sucursalName}` : " · consolidado"}
                  </span>
                </button>
              )}

              <button
                disabled={comprasDisabled}
                onClick={() => {
                  if (officeId == null) return;
                  downloadExcelFile(
                    comprasCatalogoExcelUrl({ office_id: officeId }),
                    "compras_catalogo.xlsx",
                  ).catch(console.error);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left flex flex-col items-start px-3 py-2 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] text-sm",
                  comprasDisabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white/10 active:bg-white/15 active:scale-[0.96]",
                )}
              >
                <div className="flex items-center gap-2">
                  <Download className="h-3.5 w-3.5 text-white/70" />
                  <span className="font-semibold text-white">Catálogo Completo (Sucursal)</span>
                </div>
                <span className="text-[10px] text-white/50 mt-0.5">
                  {comprasDisabled
                    ? "Selecciona una sucursal arriba para descargar"
                    : `Stock, rotación y cobertura · ${sucursalName ?? `Sucursal #${officeId}`}`}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
