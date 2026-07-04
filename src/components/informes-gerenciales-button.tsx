"use client";

import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import {
  reporteGerencialExcelUrl,
  downloadExcelFile,
  type ReporteGerencialTipo,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

/* Botón desplegable con los 3 Informes Gerenciales (1 Excel por informe).
 * Cada Excel abre con una hoja 🎯 Resumen en lenguaje simple (KPIs + "cómo
 * leer este informe") pensada para gerencia, seguida de una pestaña por
 * departamento con semáforos y autofiltro. */
const INFORMES_GERENCIALES: {
  tipo: ReporteGerencialTipo;
  label: string;
  desc: string;
  file: string;
}[] = [
  {
    tipo: "por-agotarse",
    label: "🔴 Por agotarse (<10 días)",
    desc: "Se venden rápido y el stock no llega a 10 días",
    file: "por_agotarse.xlsx",
  },
  {
    tipo: "estancados",
    label: "🧊 Inventario estancado",
    desc: "Stock que no se vende y cuánta plata inmoviliza",
    file: "inventario_estancado.xlsx",
  },
  {
    tipo: "rotacion",
    label: "🔄 Rotación de productos",
    desc: "Qué tan seguido se vende cada producto",
    file: "rotacion_productos.xlsx",
  },
];

export function InformesGerencialesButton({
  officeId,
  compact = false,
}: {
  officeId: number | null;
  /** true = versión chica para toolbars (size sm, h-8). */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const descargar = (tipo: ReporteGerencialTipo, file: string) => {
    setOpen(false);
    downloadExcelFile(
      reporteGerencialExcelUrl(tipo, { office_id: officeId }),
      file,
    ).catch(console.error);
  };

  return (
    <div className="relative">
      <Button
        variant={compact ? "outline" : "secondary"}
        size={compact ? "sm" : undefined}
        className={compact ? "h-8 shrink-0" : undefined}
        onClick={() => setOpen((o) => !o)}
        title="3 informes en Excel pensados para gerencia: por agotarse, estancados y rotación"
      >
        <Download className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span className={compact ? "hidden sm:inline" : undefined}>
          Informes Gerenciales
        </span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-surface p-1.5 shadow-2xl animate-in">
            {INFORMES_GERENCIALES.map((inf) => (
              <button
                key={inf.tipo}
                onClick={() => descargar(inf.tipo, inf.file)}
                className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-surface-2"
              >
                <p className="text-sm font-semibold text-fg">{inf.label}</p>
                <p className="text-[11px] text-muted">{inf.desc}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
