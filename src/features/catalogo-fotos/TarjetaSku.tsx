"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ImageOff, Loader2, Maximize2, Palette, Plus, RefreshCw, Star, Trash2, X } from "lucide-react";
import { num } from "@/lib/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  fotosQueryKeys,
  guardarColor,
  hacerPrincipal,
  MAX_FOTO_MB,
  quitarFotoSku,
  subirFotoSku,
  TIPOS_FOTO,
  type SkuFoto,
} from "@/lib/fotos-api";
import { EditorFoto } from "./EditorFoto";
import { VisorFotos } from "./VisorFotos";

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
  const destino = useRef(1);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [vista, setVista] = useState(1);          // qué foto se ve grande (solo en pantalla)
  const [editando, setEditando] = useState<{ archivos: File[]; posicion: number } | null>(null);
  const [visor, setVisor] = useState<number | null>(null);   // posición con la que se abre el visor
  // Color mientras se elige en el selector; se guarda al cerrarlo (no en cada movimiento).
  const [colorEnCurso, setColorEnCurso] = useState<string | null>(null);
  const colorVisible = colorEnCurso ?? s.color;
  const selectorColor = useRef<HTMLInputElement>(null);
  const colorGuardado = s.color;
  const variantId = s.variant_id;
  // El evento nativo "change" del selector llega al cerrarlo (React onChange llega en cada movimiento).
  useEffect(() => {
    const el = selectorColor.current;
    if (!el) return;
    const alCerrar = () => {
      const valor = el.value;
      if (valor.toLowerCase() === (colorGuardado ?? "").toLowerCase()) {
        setColorEnCurso(null);
        return;
      }
      setOcupado("Guardando…");
      guardarColor(variantId, valor)
        .then(() => qc.invalidateQueries({ queryKey: fotosQueryKeys.all }))
        .catch((err) => toast.error(err instanceof Error ? err.message : "No se pudo guardar el color"))
        .finally(() => { setOcupado(null); setColorEnCurso(null); });
    };
    el.addEventListener("change", alCerrar);
    return () => el.removeEventListener("change", alCerrar);
    // puedeEditar: el selector recién aparece cuando se confirma el permiso; hay que engancharlo entonces.
  }, [colorGuardado, variantId, qc, puedeEditar]);

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
    }
  };

  const fotos = s.fotos;
  const lleno = fotos.length >= maxFotos;
  const grande = fotos.find((f) => f.posicion === vista) ?? fotos[0];

  const subir = (files: FileList | null | undefined, posicion: number) => {
    const lista = Array.from(files ?? []);
    if (!lista.length) return;
    if (lista.some((f) => !TIPOS_FOTO.includes(f.type) || f.size > MAX_FOTO_MB * 1024 * 1024)) {
      toast.error(`Solo JPG, PNG o WEBP de hasta ${MAX_FOTO_MB} MB.`);
      return;
    }
    // Varias a la vez: llenan desde la posición pedida hacia adelante, sin pasar el máximo.
    const usar = lista.slice(0, Math.max(1, maxFotos - posicion + 1));
    if (lista.length > usar.length) toast.error(`Solo caben ${maxFotos} fotos por SKU: se suben ${usar.length}.`);
    if (input.current) input.current.value = "";
    setEditando({ archivos: usar, posicion });           // primero el editor; sube al guardar
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
          onListo={(listas) => subirEditadas(listas, editando.posicion)} />
      )}
      <input ref={input} type="file" multiple accept={TIPOS_FOTO.join(",")} className="hidden"
        onChange={(ev) => subir(ev.target.files, destino.current)} />

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
          <button type="button" disabled={!puedeEditar} onClick={() => elegir(1)}
            className="flex flex-col items-center gap-1 px-2 text-center text-xs text-faint enabled:hover:text-fg">
            <ImageOff className="h-8 w-8" />
            {puedeEditar ? `Arrastra hasta ${maxFotos} fotos o haz clic` : "Sin foto"}
          </button>
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
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-black/60 py-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    {pos !== 1 && (
                      <button type="button" title="Hacer principal" aria-label="Hacer principal"
                        onClick={() => { setVista(1); void correr("Guardando…", () => hacerPrincipal(s.variant_id, pos), "Foto principal cambiada"); }}
                        className="rounded p-0.5 text-yellow-300 hover:bg-white/20"><Star className="h-3 w-3" /></button>
                    )}
                    <button type="button" title="Cambiar foto" aria-label="Cambiar foto" onClick={() => elegir(pos)}
                      className="rounded p-0.5 text-white hover:bg-white/20"><RefreshCw className="h-3 w-3" /></button>
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

      <p className="mt-2 line-clamp-2 text-xs font-semibold text-fg" title={s.nombre}>{s.nombre}</p>
      <p className="mt-0.5 text-[11px] text-muted">SKU {s.sku ?? "—"} · stock {num(s.stock)}</p>

      {/* Color de muestra: cualquier tono. Sale como círculo en el catálogo si el producto tiene 2 o más. */}
      <div className="mt-auto flex items-center gap-2 pt-2">
        {puedeEditar ? (
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-2 py-1 text-xs text-muted hover:text-fg"
            title="Elegir el color de este SKU">
            <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-white/30"
              style={{ background: colorVisible ?? "transparent" }}>
              {!colorVisible && <Palette className="absolute inset-0 m-auto h-3 w-3" />}
              <input ref={selectorColor} type="color" aria-label="Color del SKU" disabled={!!ocupado}
                value={colorVisible ?? "#cccccc"}
                onChange={(ev) => setColorEnCurso(ev.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </span>
            <span className="truncate">{colorVisible ? colorVisible.toUpperCase() : "Elegir color"}</span>
          </label>
        ) : (
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="h-4 w-4 rounded-full border border-white/30" style={{ background: s.color ?? "transparent" }} />
            {s.color ? s.color.toUpperCase() : "Sin color"}
          </span>
        )}
        {puedeEditar && s.color && (
          <button type="button" title="Quitar color" aria-label="Quitar color" disabled={!!ocupado}
            onClick={() => void correr("Guardando…", () => guardarColor(s.variant_id, null))}
            className="rounded p-1 text-muted hover:bg-white/10 hover:text-fg"><X className="h-3.5 w-3.5" /></button>
        )}
      </div>
    </div>
  );
}
