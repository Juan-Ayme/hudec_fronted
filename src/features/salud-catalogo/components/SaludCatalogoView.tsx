"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/states";
import {
  CoberturaBanner,
  EstacionalesInfo,
} from "@/features/bi/shared";
import { ResumenList } from "@/features/diagnostico/components/ResumenList";
import { useCatalogHealth } from "../hooks/useCatalogHealth";
import { BootstrapPrompt } from "./BootstrapPrompt";
import { Bloque8020Section } from "./Bloque8020Section";
import { TopCategoriasList } from "./TopCategoriasList";
import { CapitalAtrapadoTable } from "./CapitalAtrapadoTable";
import { CandidatosDescuentoTable } from "./CandidatosDescuentoTable";
import { QuiebresPreviewCard } from "./QuiebresPreviewCard";
import { ComposicionCatalogoSection } from "./ComposicionCatalogoSection";
import { HuecosYoyCatalogList } from "./HuecosYoyCatalogList";

/**
 * Vista 3 — Salud del Catálogo: "¿Qué comprar / liquidar / reponer?".
 */
export function SaludCatalogoView() {
  const router = useRouter();
  const { q, preview, bootstrap } = useCatalogHealth();

  if (q.isError) return <ErrorState error={q.error} />;
  if (q.isLoading || !q.data)
    return <LoadingState label="Analizando salud del catálogo…" />;

  const c = q.data;

  return (
    <div className="flex flex-col gap-5">
      <CoberturaBanner
        cobertura={c.meta.cobertura_costos}
        onAudit={() => router.push("/configuracion?tab=costos")}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet" aria-hidden="true" />
          <h1 className="text-h2 font-bold text-fg">Salud del Catálogo</h1>
          <span className="text-caption text-faint">
            · {c.meta.fecha}
          </span>
        </div>
        <EstacionalesInfo exclusiones={c.meta.exclusiones} />
      </div>

      {c.bloque_estable_80_20 === null ? (
        <BootstrapPrompt preview={preview} bootstrap={bootstrap} />
      ) : (
        <Bloque8020Section bloque={c.bloque_estable_80_20} />
      )}

      <TopCategoriasList categorias={c.categorias} />

      <div className="grid gap-5 xl:grid-cols-2">
        <CapitalAtrapadoTable data={c.capital_atrapado} />
        <CandidatosDescuentoTable data={c.candidatos_descuento} />
      </div>

      <QuiebresPreviewCard data={c.quiebres_demanda} />

      <ComposicionCatalogoSection composicion={c.composicion_catalogo} />

      <HuecosYoyCatalogList block={c.huecos_yoy} />

      <ResumenList resumen={c.resumen} />
    </div>
  );
}
