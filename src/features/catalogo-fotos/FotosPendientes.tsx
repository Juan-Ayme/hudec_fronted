"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Clock, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useBIQuery } from "@/features/bi/shared";
import { toast } from "@/lib/toast";
import {
  fotosQueryKeys,
  getPendientes,
  pendientesQueryKey,
  quitarPendiente,
  subirPendiente,
  TIPOS_FOTO,
  type FotoPendiente,
  type ListaPendientes,
} from "@/lib/fotos-api";
import { EditorFoto } from "./EditorFoto";
import { FONDO_TRANSPARENTE } from "./fondo";

/**
 * Fotos de productos que todavía no están en BSale: se escribe el código que tendrá el SKU
 * (o su código de barras) y se suben. Quedan pendientes y el sync las pega solas al SKU
 * cuando existe y tiene stock. Si ya existe con stock, se ponen directo en él.
 */
export function FotosPendientes({ puedeEditar, fondoDisponible }: { puedeEditar: boolean; fondoDisponible: boolean }) {
  const qc = useQueryClient();
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ archivos: File[]; camara: boolean } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);

  const lista = useBIQuery<ListaPendientes>({
    queryKey: pendientesQueryKey,
    queryFn: ({ signal }) => getPendientes(signal),
    staleTime: 30_000,
  });

  const limpiarInputs = () => {
    if (input.current) input.current.value = "";
    if (camara.current) camara.current.value = "";
  };

  const elegir = (files: FileList | null, deCamara = false) => {
    const archivos = Array.from(files ?? []).filter((f) => TIPOS_FOTO.includes(f.type));
    limpiarInputs();
    if (!archivos.length) return;
    setEditando({ archivos: archivos.slice(0, lista.data?.max_fotos ?? 4), camara: deCamara });
  };

  const subir = async (listas: File[]) => {
    setEditando(null);
    const cod = codigo.trim();
    for (const [i, f] of listas.entries()) {
      setOcupado(`Subiendo ${i + 1} de ${listas.length}…`);
      try {
        const r = await subirPendiente(cod, f);
        if (r.estado === "pegada") toast.success(r.mensaje);
        else if (i === listas.length - 1) toast.success(r.mensaje);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo subir");
        break;
      }
    }
    setOcupado(null);
    await qc.invalidateQueries({ queryKey: fotosQueryKeys.all });
  };

  const quitar = async (p: FotoPendiente) => {
    setOcupado("Quitando…");
    try {
      await quitarPendiente(p.id);
      await qc.invalidateQueries({ queryKey: fotosQueryKeys.all });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo quitar");
    } finally {
      setOcupado(null);
    }
  };

  // Agrupadas por código, en el orden en que llegan (más recientes primero).
  const grupos = new Map<string, FotoPendiente[]>();
  for (const p of lista.data?.items ?? []) grupos.set(p.codigo, [...(grupos.get(p.codigo) ?? []), p]);
  for (const g of grupos.values()) g.sort((a, b) => a.posicion - b.posicion);
  const listo = codigo.trim().length > 0 && !ocupado;

  return (
    <div>
      {editando && (
        <EditorFoto archivos={editando.archivos} fondoDisponible={fondoDisponible}
          onCancelar={() => setEditando(null)}
          onRepetir={editando.camara ? () => { setEditando(null); camara.current?.click(); } : undefined}
          onListo={subir} />
      )}
      <input ref={input} type="file" multiple accept={TIPOS_FOTO.join(",")} className="hidden"
        onChange={(ev) => elegir(ev.target.files)} />
      <input ref={camara} type="file" accept={TIPOS_FOTO.join(",")} capture="environment" className="hidden"
        onChange={(ev) => elegir(ev.target.files, true)} />

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
        <p className="mb-3 text-muted">
          Para productos que todavía no están en BSale o no tienen stock: escribe el código que va a tener
          el SKU (o su código de barras) y sube las fotos. Se pegan solas al SKU en la sincronización,
          cuando ya exista y tenga stock. Si no se pegan en {lista.data?.dias_vence ?? 60} días se borran
          (suele ser un código mal escrito).
        </p>
        {puedeEditar ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input aria-label="Código del SKU" placeholder="Código del SKU o código de barras" value={codigo}
              onChange={(ev) => setCodigo(ev.target.value)} className="min-w-[220px] flex-1" />
            <Button onClick={() => input.current?.click()} disabled={!listo}>
              <Upload className="mr-1 h-4 w-4" /> Elegir fotos
            </Button>
            <Button variant="outline" onClick={() => camara.current?.click()} disabled={!listo}>
              <Camera className="mr-1 h-4 w-4" /> Cámara
            </Button>
            {ocupado && <span className="inline-flex items-center gap-1 text-xs text-muted"><Loader2 className="h-3 w-3 animate-spin" />{ocupado}</span>}
          </div>
        ) : (
          <p className="text-muted">Tu rol solo permite ver las fotos.</p>
        )}
      </div>

      {lista.isLoading ? <LoadingState label="Cargando fotos pendientes…" /> : lista.isError ? (
        <ErrorState error={lista.error} />
      ) : grupos.size === 0 ? (
        <p className="rounded-2xl border border-white/10 p-8 text-center text-sm text-muted">No hay fotos pendientes.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
          {[...grupos.entries()].map(([cod, fotos]) => (
            <div key={cod} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <b className="truncate text-fg uppercase">{cod}</b>
                <span className="inline-flex items-center gap-1 text-[11px] text-faint">
                  <Clock className="h-3 w-3" /> vence {new Date(fotos[0].vence_el).toLocaleDateString("es-PE")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {fotos.map((p) => (
                  <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl"
                    style={FONDO_TRANSPARENTE}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumb_url} alt={`${cod} foto ${p.posicion}`} className="h-full w-full object-contain" />
                    {p.posicion === 1 && <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white">★</span>}
                    {puedeEditar && (
                      <button onClick={() => quitar(p)} disabled={!!ocupado} aria-label="Quitar foto"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {fotos[0].skus_con_codigo === 0
                  ? "Esperando que el producto se cree en BSale."
                  : "Ya está en BSale: se pega cuando tenga stock en las tiendas."}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
