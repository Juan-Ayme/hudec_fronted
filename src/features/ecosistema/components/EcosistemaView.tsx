"use client";

import { useState } from "react";
import { Clock, CalendarRange, Info, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { dateTime } from "@/lib/format";
import { downloadExcelFile } from "@/lib/api";
import { ecosistemaExcelUrl } from "@/lib/bi-api";
import { useEcosistema } from "../hooks/useEcosistema";
import { EcosistemaControls } from "./EcosistemaControls";
import { EcosistemaKpis } from "./EcosistemaKpis";
import { EcosistemaTable } from "./EcosistemaTable";
import type { EcosistemaMeta, EcosistemaVeredicto } from "@/lib/bi-types";

/**
 * Ecosistema de Compras — cruce compra ↔ venta ↔ stock por nivel de taxonomía.
 * Muestra el 100% de lo que devuelve GET /compras/ecosistema: meta (contexto),
 * kpis (totales + chips por veredicto) e items (tabla con todas las métricas).
 */
export function EcosistemaView() {
  const { q, officeId, nivel, setNivel, dias, setDias } = useEcosistema();
  const [filtro, setFiltro] = useState<EcosistemaVeredicto | null>(null);

  return (
    <div>
      <PageHeader
        eyebrow="Compras"
        title="Ecosistema de Compras"
        description="Cuánto compraste de cada nivel del catálogo, cuánto vendiste de eso y qué te quedó — con multiplicador, sellthrough, cobertura y veredicto."
        actions={
          <div className="flex items-center gap-3">
            <EcosistemaControls
              nivel={nivel}
              onNivel={setNivel}
              dias={dias}
              onDias={setDias}
            />
            {q.data && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadExcelFile(
                    ecosistemaExcelUrl({
                      nivel: q.data.meta.nivel,
                      dias: q.data.meta.dias,
                      office_id: officeId,
                    }),
                    `ecosistema_compras_${q.data.meta.nivel}.xlsx`
                  ).catch(console.error);
                }}
                title="Exportar a Excel"
                className="h-9 gap-1.5 rounded-full px-4 text-sm font-medium shadow-sm transition-all bg-surface-2 border-border-soft text-muted hover:text-fg hover:bg-surface-3 hover:border-border"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar Excel</span>
              </Button>
            )}
          </div>
        }
      />

      {q.isError ? (
        <ErrorState error={q.error} />
      ) : q.isLoading || !q.data ? (
        <LoadingState label="Cruzando compra, venta y stock…" />
      ) : (
        <>
          <MetaStrip meta={q.data.meta} />
          <EcosistemaKpis kpis={q.data.kpis} filtro={filtro} onFiltro={setFiltro} />
          <EcosistemaTable items={q.data.items} nivel={q.data.meta.nivel} filtro={filtro} />
        </>
      )}
    </div>
  );
}

function MetaStrip({ meta }: { meta: EcosistemaMeta }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-muted">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
        Actualizado {dateTime(meta.generado_at)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <CalendarRange className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
        Últimos {meta.dias} días
      </span>
      <span className="inline-flex items-center gap-1.5 cursor-help" title={meta.nota}>
        <Info className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
        Compra + stock: suc. {meta.office_scope_compra.join(", ") || "—"} · Venta: suc.{" "}
        {meta.office_scope_venta.join(", ") || "—"}
      </span>
    </div>
  );
}
