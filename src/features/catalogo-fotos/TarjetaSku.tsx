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
  // Colores de muestra (un SKU surtido puede tener varios). Un solo selector nativo sirve para
  // cambiar cualquiera (editIdx = su posición) o agregar uno (editIdx = largo de la lista).
  // Mientras se elige se ve en vivo; se guarda al cerrarlo (no en cada movimiento).
  const colores = s.colores ?? (s.color ? [s.color] : []);
  const [colorEnCurso, setColorEnCurso] = useState<string | null>(null);
  const [editando_c, setEditandoC] = useState<number | null>(null);   // qué color se está eligiendo
  const editIdx = useRef<number | null>(null);                          // lo mismo, para el evento nativo
  const coloresRef = useRef(colores);
  const coloresVisibles = colorEnCurso !== null && editando_c !== null
    ? Object.assign([...colores], { [editando_c]: colorEnCurso })
    : colores;
  const selectorColor = useRef<HTMLInputElement>(null);
  const variantId = s.variant_id;
  const guardarLista = (lista: string[]) => {
    setOcupado("Guardando…");
    guardarColores(variantId, lista)
      .then(() => qc.invalidateQueries({ queryKey: fotosQueryKeys.all }))
      .catch((err) => toast.error(err instanceof Error ? err.message : "No se pudo guardar el color"))
      .finally(() => { setOcupado(null); setColorEnCurso(null); setEditandoC(null); editIdx.current = null; });
  };
  const guardarListaRef = useRef(guardarLista);
  useEffect(() => { coloresRef.current = colores; guardarListaRef.current = guardarLista; });
  // El evento nativo "change" del selector llega al cerrarlo (React onChange llega en cada movimiento).
  useEffect(() => {
    const el = selectorColor.current;
    if (!el) return;
    const alCerrar = () => {
      const i = editIdx.current, valor = el.value.toLowerCase(), actual = coloresRef.current;
      if (i === null || valor === (actual[i] ?? "").toLowerCase()) {
        setColorEnCurso(null); setEditandoC(null); editIdx.current = null;
        return;
      }
      const lista = [...actual];
      lista[i] = valor;
      guardarListaRef.current(lista.filter((c, k) => lista.indexOf(c) === k));   // sin repetir
    };
    el.addEventListener("change", alCerrar);
    return () => el.removeEventListener("change", alCerrar);
    // puedeEditar: el selector recién aparece cuando se confirma el permiso; hay que engancharlo entonces.
  }, [puedeEditar]);
  const abrirColor = (i: number) => {
    const el = selectorColor.current;
    if (!el) return;
    editIdx.current = i;
    setEditandoC(i);
    el.value = colores[i] ?? colores[colores.length - 1] ?? "#cccccc";
    try { el.showPicker(); } catch { el.click(); }
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
        grande ? "bg-white" : "border border-dashed border-white/15 bg-white/[0.02]")}>
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
              <div key={pos} className={cn("group relative aspect-square overflow-hidden rounded-lg bg-white ring-2",
                vista === pos ? "ring-primary" : "ring-transparent")}>
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
            <button type="button" disabled={!puedeEditar || !!ocupado} onClick={() => abrirColor(i)}
              title={puedeEditar ? `${c.toUpperCase()} · tocar para cambiarlo` : c.toUpperCase()}
              aria-label={`Color ${i + 1}: ${c}`}
              className="block h-6 w-6 rounded-full border border-white/30 enabled:hover:scale-110" style={{ background: c }} />
            {puedeEditar && !ocupado && (
              <button type="button" title="Quitar este color" aria-label={`Quitar el color ${c}`}
                onClick={() => guardarLista(colores.filter((_, k) => k !== i))}
                className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-black/80 text-white group-hover/c:flex [@media(hover:none)]:flex">
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}
        {puedeEditar && coloresVisibles.length < MAX_COLORES && (
          <button type="button" disabled={!!ocupado} onClick={() => abrirColor(colores.length)}
            title="Agregar un color (si el SKU viene en varios colores, agrega cada uno)"
            className="flex h-6 items-center gap-1 rounded-full border border-dashed border-white/25 px-2 text-[11px] text-muted hover:border-primary hover:text-fg disabled:opacity-40">
            {colores.length ? <Plus className="h-3 w-3" /> : <Palette className="h-3 w-3" />}
            {colores.length ? "Color" : "Elegir color"}
          </button>
        )}
        {!puedeEditar && !colores.length && <span className="text-xs text-muted">Sin color</span>}
        {puedeEditar && (
          <input ref={selectorColor} type="color" aria-hidden tabIndex={-1} defaultValue="#cccccc"
            onChange={(ev) => setColorEnCurso(ev.target.value)}
            className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 opacity-0" />
        )}
      </div>
    </div>
  );
}
