"use client";

import { useEffect, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useCompany } from "@/components/company-context";
import { useBIQuery } from "@/features/bi/shared";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getCatalogoOpciones, type CatalogoOpciones } from "@/lib/informes-api";
import {
  fotosQueryKeys,
  getEstadoFotos,
  getSkusFoto,
  type EstadoFotos,
  type FiltroFoto,
  type ListaSkusFoto,
} from "@/lib/fotos-api";
import { TarjetaSku } from "./TarjetaSku";

/**
 * Fotos del catálogo: hasta 4 fotos por SKU (variante) con una principal, y el color del SKU.
 * Se busca el SKU, se suben las fotos y quedan en Cloudinary; el catálogo PDF (y más adelante
 * la web) las usa. Primero salen los SKU con más
 * stock, que son los que más conviene tener con foto.
 */

const PAGINA = 40;

function useDebounced<T>(v: T, ms = 350): T {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function FotosCatalogoView() {
  const { activeRole } = useCompany();
  const puedeEditar = activeRole === "admin" || activeRole === "operador";
  const [texto, setTexto] = useState("");
  const q = useDebounced(texto);
  const [dep, setDep] = useState("");
  const [estado, setEstado] = useState<FiltroFoto>("sin_foto");
  const [limit, setLimit] = useState(PAGINA);
  // Al cambiar un filtro se vuelve a la primera página.
  const filtros = `${q}|${dep}|${estado}`;
  const [filtrosPrev, setFiltrosPrev] = useState(filtros);
  if (filtros !== filtrosPrev) {
    setFiltrosPrev(filtros);
    setLimit(PAGINA);
  }

  const params = { q, departamento: dep || null, estado, limit };
  const lista = useBIQuery<ListaSkusFoto>({
    queryKey: fotosQueryKeys.skus(params),
    queryFn: ({ signal }) => getSkusFoto(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const estadoQ = useBIQuery<EstadoFotos>({
    queryKey: fotosQueryKeys.estado(),
    queryFn: ({ signal }) => getEstadoFotos(signal),
    staleTime: 30_000,
  });
  const opciones = useBIQuery<CatalogoOpciones>({
    queryKey: ["informes", "catalogo", "opciones"],
    queryFn: ({ signal }) => getCatalogoOpciones(signal),
  });

  const e = estadoQ.data;
  const items = lista.data?.items ?? [];
  const total = lista.data?.total ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo & Stock"
        title="Fotos del catálogo"
        description="Hasta 4 fotos por SKU (la ★ es la principal) y su color (eliges el tono exacto) para los círculos del catálogo. Solo aparecen los SKU con stock, para no cargar fotos de productos antiguos; arriba los de más stock."
      />

      {e && (
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
          <span><b className="text-fg">{num(e.skus_con_foto)}</b> <span className="text-muted">de {num(e.skus)} SKU activos tienen foto</span></span>
          <span><b className="text-fg">{num(e.productos_con_foto)}</b> <span className="text-muted">de {num(e.productos)} productos con al menos una</span></span>
          {!e.storage_configured && (
            <span className="text-danger">Cloudinary no está configurado en el backend: no se pueden subir fotos.</span>
          )}
          {!puedeEditar && <span className="text-muted">Tu rol solo permite ver las fotos.</span>}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input aria-label="Buscar" placeholder="Buscar por nombre, SKU o código de barras…" value={texto}
            onChange={(ev) => setTexto(ev.target.value)} className="w-full pl-9" />
        </div>
        <Select aria-label="Departamento" value={dep} onChange={(ev) => setDep(ev.target.value)}>
          <option value="">Todos los departamentos</option>
          {(opciones.data?.departamentos ?? []).map((d) => (
            <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
          ))}
        </Select>
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {([["sin_foto", "Sin foto"], ["con_foto", "Con foto"], ["todos", "Todos"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setEstado(v)}
              className={cn("rounded-full px-3 py-1 text-xs transition-colors",
                estado === v ? "bg-primary text-white" : "text-muted hover:text-fg")}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {lista.isLoading ? <LoadingState label="Cargando SKU…" /> : lista.isError ? (
        <ErrorState error={lista.error} />
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-white/10 p-8 text-center text-sm text-muted">
          {estado === "sin_foto" ? "No hay SKU sin foto con estos filtros." : "No hay SKU con estos filtros."}
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted">{num(total)} SKU · mostrando {items.length}</p>
          <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5", lista.isFetching && "opacity-80")}>
            {items.map((s) => (
              <TarjetaSku key={s.variant_id} s={s} puedeEditar={puedeEditar && !!e?.storage_configured}
                maxFotos={lista.data?.max_fotos ?? 4} fondoDisponible={!!e?.quitar_fondo} />
            ))}
          </div>
          {items.length < total && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => setLimit(limit + PAGINA)} disabled={lista.isFetching}>
                {lista.isFetching ? "Cargando…" : `Ver más (${num(total - items.length)} restantes)`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
