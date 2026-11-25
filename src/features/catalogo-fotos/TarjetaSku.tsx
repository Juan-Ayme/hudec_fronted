"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, ImageOff, Loader2, Maximize2, Palette, Plus, RefreshCw, Star, Trash2, X } from "lucide-react";
import { num } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  fotosQueryKeys,
  guardarColores,
  MAX_COLORES,
  hacerPrincipal,
  quitarFotoSku,
  subirFotoSku,
  TIPOS_FOTO,
  type SkuFoto,
} from "@/lib/fotos-api";
import { EditorFoto } from "./EditorFoto";
import { FONDO_TRANSPARENTE } from "./fondo";
import { VisorFotos } from "./VisorFotos";

/** Tope del archivo original (antes del editor). Lo que se sube sale achicado y bajo MAX_FOTO_MB. */
const MAX_ORIGINAL_MB = 40;

/**
 * Tarjeta de un SKU: foto grande + sus 4 posiciones (★ = principal) + color.
 * Pasando el mouse sobre una miniatura: ★ hacer principal, ↻ cambiar, 🗑 quitar.
 * Se pueden arrastrar o elegir varias fotos a la vez (llenan los espacios libres). Antes de
 * subir se abre el editor: recortar, girar y quitar el fondo.
 */
export function TarjetaSku({ s, puedeEditar, maxFotos, fondoDisponible }: {
  s: SkuFoto; puedeEditar: boolean; maxFotos: number; fondoDisponible: boolean;
}) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const camara = useRef<HTMLInputElement>(null);      // mismo selector, pero abre la cámara trasera
  const destino = useRef(1);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [vista, setVista] = useState(1);          // qué foto se ve grande (solo en pantalla)
  const [editando, setEditando] = useState<{ archivos: File[]; posicion: number; camara: boolean } | null>(null);
  const [visor, setVisor] = useState<number | null>(null);   // posición con la que se abre el visor
  // Colores de muestra (un SKU surtido puede tener varios). Cada círculo y el "+ Color" llevan
  // su propio selector nativo encima (se toca el selector real: en el celular un selector
  // oculto abierto por código no siempre se abre). Mientras se elige se ve en vivo.
  const colores = s.colores ?? (s.color ? [s.color] : []);
  const [enVivo, setEnVivo] = useState<{ i: number; c: string } | null>(null);
  const coloresVisibles = enVivo ? Object.assign([...colores], { [enVivo.i]: enVivo.c }) : colores;
  const variantId = s.variant_id;
  const guardarLista = (lista: string[]) => {
    setOcupado("Guardando…");
    guardarColores(variantId, lista.filter((c, k) => lista.indexOf(c) === k))   // sin repetir
      .then(() => qc.invalidateQueries({ queryKey: fotosQueryKeys.all }))
      .catch((err) => toast.error(err instanceof Error ? err.message : "No se pudo guardar el color"))
      .finally(() => { setOcupado(null); setEnVivo(null); });
  };
  const elegido = (i: number, c: string) => {
    if (c.toLowerCase() === (colores[i] ?? "").toLowerCase()) { setEnVivo(null); return; }
    const lista = [...colores];
    lista[i] = c.toLowerCase();
    guardarLista(lista);
  };

  const correr = async (msg: string, fn: () => Promise<unknown>, ok?: string) => {
    setOcupado(msg);
    try {
      await fn();
      if (ok) toast.success(ok);
      await qc.invalidateQueries({ queryKey: fotosQueryKeys.all });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setOcupado(null);
      if (input.current) input.current.value = "";
      if (camara.current) camara.current.value = "";
    }
  };

  const fotos = s.fotos;
  const lleno = fotos.length >= maxFotos;
  const grande = fotos.find((f) => f.posicion === vista) ?? fotos[0];

  const subir = (files: FileList | null | undefined, posicion: number, desdeCamara = false) => {
    const lista = Array.from(files ?? []);
    if (camara.current) camara.current.value = "";
    if (!lista.length) return;
    // El tope de MAX_FOTO_MB vale para lo que se sube; el editor achica a 2000 px y convierte,
    // así que aquí se acepta el original grande (fotos de celular de 48-50 MP).
    if (lista.some((f) => !TIPOS_FOTO.includes(f.type) || f.size > MAX_ORIGINAL_MB * 1024 * 1024)) {
      toast.error(`Solo JPG, PNG o WEBP de hasta ${MAX_ORIGINAL_MB} MB.`);
      return;
    }
    // Varias a la vez: llenan desde la posición pedida hacia adelante, sin pasar el máximo.
    const usar = lista.slice(0, Math.max(1, maxFotos - posicion + 1));
    if (lista.length > usar.length) toast.error(`Solo caben ${maxFotos} fotos por SKU: se suben ${usar.length}.`);
    if (input.current) input.current.value = "";
    setEditando({ archivos: usar, posicion, camara: desdeCamara });   // primero el editor; sube al guardar
  };
  const subirEditadas = (listas: File[], posicion: number) => {
    setEditando(null);
    void correr("Subiendo…", async () => {
      for (const [i, f] of listas.entries()) await subirFotoSku(s.variant_id, posicion + i, f);
    }, listas.length > 1 ? `${listas.length} fotos guardadas` : `Foto guardada: ${s.sku ?? s.nombre}`);
  };
  const elegir = (posicion: number) => {
    destino.current = posicion;
    input.current?.click();
  };
  // Abre la cámara (en PC sin cámara, el navegador muestra el selector de archivos).
  const tomarFoto = (posicion: number) => {
    destino.current = posicion;
    camara.current?.click();
  };

  return (
    <div
      onDragOver={(ev) => { if (puedeEditar && !lleno) { ev.preventDefault(); setArrastrando(true); } }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(ev) => {
        if (!puedeEditar || lleno) return;
        ev.preventDefault();
        setArrastrando(false);
        subir(ev.dataTransfer.files, fotos.length + 1);
      }}
      className={cn("flex flex-col rounded-2xl border bg-white/[0.03] p-3 transition-colors",
        arrastrando ? "border-primary bg-primary/10" : "border-white/10")}>
      {visor !== null && fotos.length > 0 && (
        <VisorFotos fotos={fotos} inicio={visor} titulo={s.nombre} sku={s.sku} onCerrar={() => setVisor(null)} />
      )}
      {editando && (
        <EditorFoto archivos={editando.archivos} fondoDisponible={fondoDisponible}
          onCancelar={() => setEditando(null)}
          onRepetir={editando.camara ? () => { const pos = editando.posicion; setEditando(null); tomarFoto(pos); } : undefined}
          onListo={(listas) => subirEditadas(listas, editando.posicion)} />
      )}
      <input ref={input} type="file" multiple accept={TIPOS_FOTO.join(",")} className="hidden"
        onChange={(ev) => subir(ev.target.files, destino.current)} />
      {/* capture: en el celular abre directo la cámara trasera. accept con tipos concretos hace que
          el iPhone entregue JPEG (no HEIC). */}
      <input ref={camara} type="file" accept={TIPOS_FOTO.join(",")} capture="environment" className="hidden"
        onChange={(ev) => subir(ev.target.files, destino.current, true)} />

      {/* Foto grande */}
      <div className={cn("relative flex aspect-square items-center justify-center overflow-hidden rounded-xl",
        grande ? "" : "border border-dashed border-white/15 bg-white/[0.02]")}
        style={grande ? FONDO_TRANSPARENTE : undefined}>
        {grande ? (
          <button type="button" onClick={() => setVisor(grande.posicion)} title="Ver en grande"
            aria-label={`Ver en grande las fotos de ${s.nombre}`}
            className="group/foto relative h-full w-full cursor-zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada por Cloudinary */}
            <img src={grande.thumb_url} alt={s.nombre} loading="lazy" className="h-full w-full object-contain" />
            <span className="pointer-events-none absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover/foto:opacity-100">
              <Maximize2 className="h-3 w-3" /> Ver en grande
            </span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2 px-2 text-center text-xs text-faint">
            <ImageOff className="h-8 w-8" />
            {puedeEditar ? (
              <>
                <button type="button" disabled={!!ocupado} onClick={() => tomarFoto(1)}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 font-medium text-white hover:bg-primary/85 disabled:opacity-40">
                  <Camera className="h-4 w-4" /> Tomar foto
                </button>
                <button type="button" disabled={!!ocupado} onClick={() => elegir(1)} className="hover:text-fg hover:underline">
                  o elegir archivo (hasta {maxFotos})
                </button>
              </>
            ) : "Sin foto"}
          </div>
        )}
        {grande && grande.posicion === 1 && fotos.length > 1 && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-yellow-300">
            <Star className="h-3 w-3 fill-yellow-300" /> Principal
          </span>
        )}
        {ocupado && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> {ocupado}
          </div>
        )}
      </div>

      {/* Las posiciones 1..max */}
      {(fotos.length > 0 || puedeEditar) && (
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {Array.from({ length: maxFotos }, (_, i) => i + 1).map((pos) => {
            const f = fotos.find((x) => x.posicion === pos);
            if (!f) {
              const siguiente = pos === fotos.length + 1 && puedeEditar;
              return (
                <button key={pos} type="button" disabled={!siguiente || !!ocupado}
                  onClick={() => elegir(pos)} title={siguiente ? "Agregar foto" : undefined}
                  aria-label={siguiente ? "Agregar foto" : `Espacio ${pos} vacío`}
                  className={cn("flex aspect-square items-center justify-center rounded-lg border border-dashed text-faint",
                    siguiente ? "border-white/25 hover:border-primary hover:text-primary" : "border-white/10 opacity-40")}>
                  {siguiente ? <Plus className="h-4 w-4" /> : null}
                </button>
              );
            }
            return (
              <div key={pos} className={cn("group relative aspect-square overflow-hidden rounded-lg ring-2",
                vista === pos ? "ring-primary" : "ring-transparent")} style={FONDO_TRANSPARENTE}>
                <button type="button" onClick={() => setVista(pos)} className="h-full w-full" aria-label={`Ver foto ${pos}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de Cloudinary */}
                  <img src={f.thumb_url} alt="" loading="lazy" className="h-full w-full object-contain" />
                </button>
                {pos === 1 && <Star className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 fill-yellow-300 text-yellow-300" />}
                {puedeEditar && !ocupado && (
                  // En el celular no hay "pasar el mouse": los botones se ven siempre.
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-black/60 py-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                    {pos !== 1 && (
                      <button type="button" title="Hacer principal" aria-label="Hacer principal"
                        onClick={() => { setVista(1); void correr("Guardando…", () => hacerPrincipal(s.variant_id, pos), "Foto principal cambiada"); }}
                        className="rounded p-0.5 text-yellow-300 hover:bg-white/20"><Star className="h-3 w-3" /></button>
                    )}
                    <button type="button" title="Cambiar foto" aria-label="Cambiar foto" onClick={() => elegir(pos)}
                      className="rounded p-0.5 text-white hover:bg-white/20"><RefreshCw className="h-3 w-3" /></button>
                    <button type="button" title="Sustituir con una foto nueva" aria-label="Sustituir con una foto nueva" onClick={() => tomarFoto(pos)}
                      className="rounded p-0.5 text-white hover:bg-white/20"><Camera className="h-3 w-3" /></button>
                    <button type="button" title="Quitar foto" aria-label="Quitar foto"
                      onClick={() => {
                        if (!window.confirm(`¿Quitar la foto ${pos} de "${s.nombre}"? Se borra también de Cloudinary.`)) return;
                        setVista(1);
                        void correr("Quitando…", () => quitarFotoSku(s.variant_id, pos), "Foto quitada");
                      }}
                      className="rounded p-0.5 text-red-300 hover:bg-white/20"><Trash2 className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {puedeEditar && !lleno && fotos.length > 0 && (
        <button type="button" disabled={!!ocupado} onClick={() => tomarFoto(fotos.length + 1)}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-white/15 py-1.5 text-xs text-muted hover:border-primary hover:text-primary disabled:opacity-40">
          <Camera className="h-3.5 w-3.5" /> Tomar foto
        </button>
      )}

      <p className="mt-2 line-clamp-2 text-xs font-semibold text-fg" title={s.nombre}>{s.nombre}</p>
      <p className="mt-0.5 text-[11px] text-muted">SKU {s.sku ?? "—"} · stock {num(s.stock)}</p>

      {/* Colores de muestra: cualquier tono, uno o varios (SKU surtido). Salen como círculos en el catálogo. */}
      <div className="relative mt-auto flex flex-wrap items-center gap-1.5 pt-2">
        {coloresVisibles.map((c, i) => (
          <span key={i} className="group/c relative">
            <span className="block h-7 w-7 rounded-full border border-white/30" style={{ background: c }} />
            {puedeEditar && (
              <SelectorColor key={colores[i]} valor={c} disabled={!!ocupado} etiqueta={`Cambiar el color ${i + 1} (${c})`}
                onVivo={(v) => setEnVivo({ i, c: v })} onListo={(v) => elegido(i, v)} />
            )}
            {puedeEditar && !ocupado && (
              <button type="button" title="Quitar este color" aria-label={`Quitar el color ${c}`}
                onClick={() => guardarLista(colores.filter((_, k) => k !== i))}
                className="absolute -right-1.5 -top-1.5 z-10 hidden h-4 w-4 items-center justify-center rounded-full bg-black/80 text-white group-hover/c:flex [@media(hover:none)]:flex">
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}
        {puedeEditar && coloresVisibles.length < MAX_COLORES && (
          <span className={cn("relative flex h-7 items-center gap-1 rounded-full border border-dashed border-white/25 px-2.5 text-xs text-muted hover:border-primary hover:text-fg",
            ocupado && "opacity-40")}>
            {colores.length ? <Plus className="h-3.5 w-3.5" /> : <Palette className="h-3.5 w-3.5" />}
            {colores.length ? "Color" : "Elegir color"}
            {/* key: tras guardar, un selector nuevo (vacío) para el siguiente color */}
            <SelectorColor key={colores.length} valor={colores[colores.length - 1] ?? "#cccccc"} disabled={!!ocupado}
              etiqueta="Agregar un color" onVivo={(v) => setEnVivo({ i: colores.length, c: v })}
              onListo={(v) => elegido(colores.length, v)} />
          </span>
        )}
        {!puedeEditar && !colores.length && <span className="text-xs text-muted">Sin color</span>}
      </div>
    </div>
  );
}

/**
 * Selector de color nativo, invisible y encima de lo que se ve (un círculo o "+ Color"):
 * el dedo o el mouse tocan el selector real. `onVivo` llega mientras se mueve; `onListo`, al
 * cerrarlo (evento nativo "change"; React onChange llega en cada movimiento).
 */
function SelectorColor({ valor, disabled, etiqueta, onVivo, onListo }: {
  valor: string; disabled: boolean; etiqueta: string;
  onVivo: (c: string) => void; onListo: (c: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const listo = useRef(onListo);
  useEffect(() => { listo.current = onListo; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const alCerrar = () => listo.current(el.value);
    el.addEventListener("change", alCerrar);
    return () => el.removeEventListener("change", alCerrar);
  }, []);
  return (
    <input ref={ref} type="color" aria-label={etiqueta} title={etiqueta} disabled={disabled}
      defaultValue={valor} onChange={(ev) => onVivo(ev.target.value)}
      className="absolute inset-0 h-full w-full cursor-pointer rounded-full opacity-0 disabled:cursor-default" />
  );
}
