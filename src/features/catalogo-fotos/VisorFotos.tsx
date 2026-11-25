"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, Star, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FotoSku } from "@/lib/fotos-api";
import { FONDO_TRANSPARENTE } from "./fondo";

/**
 * Visor a pantalla completa de las fotos de un SKU: la foto en alta resolución (Cloudinary,
 * hasta 2000 px, formato y calidad automáticos), flechas o ← → para pasar entre fotos, zoom
 * con clic o rueda (la foto sigue al mouse) y Esc para cerrar.
 */

/** Versión grande y nítida para pantalla. */
function urlGrande(url: string): string {
  const m = "/image/upload/";
  return url.includes(m) ? url.replace(m, `${m}c_limit,w_2000,h_2000,f_auto,q_auto:best/`) : url;
}

const ZOOM = 2.5;

export function VisorFotos({ fotos, inicio, titulo, sku, onCerrar }: {
  fotos: FotoSku[]; inicio: number; titulo: string; sku: string | null; onCerrar: () => void;
}) {
  const [i, setI] = useState(() => Math.max(0, fotos.findIndex((f) => f.posicion === inicio)));
  const [zoom, setZoom] = useState(false);
  const [origen, setOrigen] = useState({ x: 50, y: 50 });       // punto del zoom, en %
  const [cargada, setCargada] = useState<string | null>(null);   // url ya cargada (para el spinner)
  const caja = useRef<HTMLDivElement>(null);
  const f = fotos[i];
  const grande = urlGrande(f.url);
  const n = fotos.length;

  const ir = useCallback((d: number) => {
    setI((x) => (x + d + n) % n);
    setZoom(false);
  }, [n]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      else if (e.key === "ArrowRight" && n > 1) ir(1);
      else if (e.key === "ArrowLeft" && n > 1) ir(-1);
    };
    window.addEventListener("keydown", k);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = antes; };
  }, [ir, n, onCerrar]);

  // Precarga la siguiente y la anterior para que el cambio sea inmediato.
  useEffect(() => {
    if (n < 2) return;
    for (const d of [1, -1]) {
      const im = new Image();
      im.src = urlGrande(fotos[(i + d + n) % n].url);
    }
  }, [i, n, fotos]);

  const apuntar = (ev: React.MouseEvent) => {
    const b = caja.current?.getBoundingClientRect();
    if (!b) return;
    setOrigen({ x: ((ev.clientX - b.left) / b.width) * 100, y: ((ev.clientY - b.top) / b.height) * 100 });
  };

  if (typeof document === "undefined") return null;
  const boton = "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Fotos de ${titulo}`} className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-md"
      onClick={onCerrar}>
      {/* Barra superior */}
      <div className="flex items-center gap-3 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{titulo}</p>
          <p className="flex items-center gap-1.5 text-xs text-white/60">
            {sku && <>SKU {sku} · </>}Foto {i + 1} de {n}
            {f.posicion === 1 && n > 1 && <span className="flex items-center gap-1 text-yellow-300"><Star className="h-3 w-3 fill-yellow-300" /> principal</span>}
          </p>
        </div>
        <button type="button" className={boton} onClick={() => setZoom(!zoom)} aria-label={zoom ? "Alejar" : "Acercar"} title={zoom ? "Alejar" : "Acercar (o clic en la foto)"}>
          {zoom ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </button>
        <a href={f.url} target="_blank" rel="noreferrer" className={boton} aria-label="Abrir original" title="Abrir la foto original en otra pestaña">
          <ExternalLink className="h-5 w-5" />
        </a>
        <button type="button" className={boton} onClick={onCerrar} aria-label="Cerrar" title="Cerrar (Esc)"><X className="h-5 w-5" /></button>
      </div>

      {/* Foto */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16">
        {n > 1 && (
          <button type="button" className={cn(boton, "absolute left-3 top-1/2 z-10 -translate-y-1/2")} aria-label="Foto anterior"
            onClick={(e) => { e.stopPropagation(); ir(-1); }}><ChevronLeft className="h-6 w-6" /></button>
        )}
        <div ref={caja} className={cn("relative flex h-full w-full items-center justify-center overflow-hidden",
          zoom ? "cursor-zoom-out" : "cursor-zoom-in")}
          onClick={(e) => { e.stopPropagation(); apuntar(e); setZoom(!zoom); }}
          onMouseMove={(e) => { if (zoom) apuntar(e); }}
          onWheel={(e) => { apuntar(e); setZoom(e.deltaY < 0); }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- foto de Cloudinary en alta resolución */}
          <img key={grande} src={grande} alt={titulo} draggable={false} onLoad={() => setCargada(grande)}
            className="max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl transition-transform duration-200 ease-out"
            style={{ ...FONDO_TRANSPARENTE, transform: zoom ? `scale(${ZOOM})` : "none", transformOrigin: `${origen.x}% ${origen.y}%` }} />
          {cargada !== grande && (
            <Loader2 className="pointer-events-none absolute h-8 w-8 animate-spin text-white/70" />
          )}
        </div>
        {n > 1 && (
          <button type="button" className={cn(boton, "absolute right-3 top-1/2 z-10 -translate-y-1/2")} aria-label="Foto siguiente"
            onClick={(e) => { e.stopPropagation(); ir(1); }}><ChevronRight className="h-6 w-6" /></button>
        )}
      </div>

      {/* Miniaturas */}
      {n > 1 && (
        <div className="flex justify-center gap-2 pb-4" onClick={(e) => e.stopPropagation()}>
          {fotos.map((x, k) => (
            <button key={x.posicion} type="button" onClick={() => { setI(k); setZoom(false); }} aria-label={`Ver foto ${k + 1}`}
              className={cn("h-14 w-14 overflow-hidden rounded-lg ring-2 transition-opacity",
                k === i ? "ring-primary" : "opacity-60 ring-transparent hover:opacity-100")} style={FONDO_TRANSPARENTE}>
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de Cloudinary */}
              <img src={x.thumb_url} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
