"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Crop, Eraser, Loader2, Maximize, RotateCw, Square, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { quitarFondo } from "@/lib/fotos-api";

/**
 * Editor antes de subir: recortar (libre o cuadrado), girar, quitar el fondo (en el backend
 * local, con rembg) y elegir fondo transparente o blanco. Si se eligen varias fotos, se
 * editan una tras otra. Devuelve los archivos listos para subir.
 */

type Rect = { x: number; y: number; w: number; h: number };   // 0..1 sobre la imagen trabajada
const TODO: Rect = { x: 0, y: 0, w: 1, h: 1 };
const MIN = 0.05;
const MAX_SALIDA = 2000;

function cargar(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => mal(new Error("No se pudo leer la imagen"));
    im.src = url;
  });
}

function aBlob(c: HTMLCanvasElement, tipo: string, q?: number): Promise<Blob> {
  return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo generar la imagen"))), tipo, q));
}

/** Gira la imagen (0/90/180/270) y devuelve un object URL de la versión girada. */
async function girar(url: string, grados: number): Promise<string> {
  if (grados % 360 === 0) return url;
  const im = await cargar(url);
  const c = document.createElement("canvas");
  const lado = grados % 180 !== 0;
  c.width = lado ? im.naturalHeight : im.naturalWidth;
  c.height = lado ? im.naturalWidth : im.naturalHeight;
  const g = c.getContext("2d")!;
  g.translate(c.width / 2, c.height / 2);
  g.rotate((grados * Math.PI) / 180);
  g.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
  return URL.createObjectURL(await aBlob(c, "image/png"));
}

/** Caja del producto (píxeles no transparentes) con un margen, en coordenadas 0..1. */
async function cajaProducto(url: string): Promise<Rect | null> {
  const im = await cargar(url);
  const esc = Math.min(1, 400 / Math.max(im.naturalWidth, im.naturalHeight));
  const w = Math.max(1, Math.round(im.naturalWidth * esc)), h = Math.max(1, Math.round(im.naturalHeight * esc));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.drawImage(im, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (d[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const m = 0.03;
  const r = { x: x0 / w - m, y: y0 / h - m, w: (x1 - x0 + 1) / w + 2 * m, h: (y1 - y0 + 1) / h + 2 * m };
  r.x = Math.max(0, r.x); r.y = Math.max(0, r.y);
  r.w = Math.min(1 - r.x, r.w); r.h = Math.min(1 - r.y, r.h);
  return r;
}

export function EditorFoto({ archivos, fondoDisponible, onListo, onCancelar }: {
  archivos: File[];
  fondoDisponible: boolean;
  onListo: (salida: File[]) => void;
  onCancelar: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [hechos, setHechos] = useState<File[]>([]);
  const archivo = archivos[idx];
  if (!archivo || typeof document === "undefined") return null;
  const siguiente = (f: File) => {
    const lista = [...hechos, f];
    if (idx + 1 < archivos.length) { setHechos(lista); setIdx(idx + 1); }
    else onListo(lista);
  };
  // key: cada foto arranca con el editor limpio
  return <EditorUna key={idx} archivo={archivo} n={idx + 1} total={archivos.length}
    fondoDisponible={fondoDisponible} onSiguiente={siguiente} onCancelar={onCancelar} />;
}

function EditorUna({ archivo, n, total, fondoDisponible, onSiguiente, onCancelar }: {
  archivo: File; n: number; total: number; fondoDisponible: boolean;
  onSiguiente: (f: File) => void; onCancelar: () => void;
}) {
  // Estado de la foto en edición
  // Data URL (no object URL): en desarrollo React monta dos veces y un revoke en la limpieza
  // dejaría la imagen sin cargar.
  const [original, setOriginal] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    const lector = new FileReader();
    lector.onload = () => { if (vivo) setOriginal(lector.result as string); };
    lector.onerror = () => toast.error("No se pudo leer la foto");
    lector.readAsDataURL(archivo);
    return () => { vivo = false; };
  }, [archivo]);
  const [sinFondo, setSinFondo] = useState<string | null>(null);
  const [usarSinFondo, setUsarSinFondo] = useState(false);
  const [blanco, setBlanco] = useState(true);
  const [grados, setGrados] = useState(0);
  const [trabajo, setTrabajo] = useState<string | null>(null);      // imagen girada que se muestra
  const [rect, setRect] = useState<Rect>(TODO);
  const [cuadrado, setCuadrado] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [nat, setNat] = useState({ w: 1, h: 1 });

  // Imagen de trabajo = (original o sin fondo) girada
  const base = usarSinFondo && sinFondo ? sinFondo : original;
  useEffect(() => {
    if (!base) return;
    let vivo = true;
    let creada: string | null = null;
    girar(base, grados).then((u) => {
      if (u !== base) creada = u;
      if (vivo) setTrabajo(u);
    }).catch(() => toast.error("No se pudo girar la imagen"));
    return () => { vivo = false; if (creada) URL.revokeObjectURL(creada); };
  }, [base, grados]);

  // ── recorte con el mouse ──
  const caja = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ modo: string; px: number; py: number; r: Rect } | null>(null);

  const conCuadrado = useCallback((r: Rect, ancla: "x" | "y" = "x"): Rect => {
    if (!cuadrado) return r;
    // cuadrado en píxeles: w * W = h * H
    const ratio = nat.w / nat.h;
    let { w, h } = r;
    if (ancla === "x") h = w * ratio; else w = h / ratio;
    if (r.y + h > 1) { h = 1 - r.y; w = h / ratio; }
    if (r.x + w > 1) { w = 1 - r.x; h = w * ratio; }
    return { ...r, w, h };
  }, [cuadrado, nat]);

  // El modo (mover o qué borde) viene en data-modo del elemento que se arrastra.
  const empezar = (ev: React.PointerEvent<HTMLElement>) => {
    ev.preventDefault(); ev.stopPropagation();
    const modo = ev.currentTarget.dataset.modo ?? "mover";
    ev.currentTarget.setPointerCapture(ev.pointerId);
    arrastre.current = { modo, px: ev.clientX, py: ev.clientY, r: rect };
  };
  const mover = (ev: React.PointerEvent) => {
    const a = arrastre.current, el = caja.current;
    if (!a || !el) return;
    const b = el.getBoundingClientRect();
    const dx = (ev.clientX - a.px) / b.width, dy = (ev.clientY - a.py) / b.height;
    let { x, y, w, h } = a.r;
    if (a.modo === "mover") {
      x = Math.min(Math.max(0, x + dx), 1 - w); y = Math.min(Math.max(0, y + dy), 1 - h);
      setRect({ x, y, w, h });
      return;
    }
    if (a.modo.includes("w")) { const nx = Math.min(Math.max(0, x + dx), x + w - MIN); w = w + (x - nx); x = nx; }
    if (a.modo.includes("e")) { w = Math.min(Math.max(MIN, w + dx), 1 - x); }
    if (a.modo.includes("n")) { const ny = Math.min(Math.max(0, y + dy), y + h - MIN); h = h + (y - ny); y = ny; }
    if (a.modo.includes("s")) { h = Math.min(Math.max(MIN, h + dy), 1 - y); }
    setRect(conCuadrado({ x, y, w, h }, a.modo === "n" || a.modo === "s" ? "y" : "x"));
  };
  const soltar = () => { arrastre.current = null; };

  // ── acciones ──
  const hacerSinFondo = async () => {
    if (sinFondo) { setUsarSinFondo(!usarSinFondo); return; }
    if (!archivo) return;
    setOcupado("Quitando el fondo… (unos segundos)");
    try {
      const blob = await quitarFondo(archivo);
      setSinFondo(URL.createObjectURL(blob));
      setUsarSinFondo(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo quitar el fondo");
    } finally {
      setOcupado(null);
    }
  };
  useEffect(() => () => { if (sinFondo) URL.revokeObjectURL(sinFondo); }, [sinFondo]);

  const ajustarAlProducto = async () => {
    if (!trabajo) return;
    const r = await cajaProducto(trabajo);
    if (r) setRect(conCuadrado(r)); else toast.error("No se encontró el producto en la imagen");
  };

  const exportar = async (): Promise<File> => {
    const im = await cargar(trabajo!);
    const W = im.naturalWidth, H = im.naturalHeight;
    const sx = Math.round(rect.x * W), sy = Math.round(rect.y * H);
    const sw = Math.max(1, Math.round(rect.w * W)), sh = Math.max(1, Math.round(rect.h * H));
    const esc = Math.min(1, MAX_SALIDA / Math.max(sw, sh));
    const c = document.createElement("canvas");
    c.width = Math.round(sw * esc); c.height = Math.round(sh * esc);
    const g = c.getContext("2d")!;
    const transparente = usarSinFondo && !blanco;
    if (!transparente) { g.fillStyle = "#ffffff"; g.fillRect(0, 0, c.width, c.height); }
    g.drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
    // Transparente -> WebP (guarda la transparencia y pesa ~7 veces menos que PNG); si el
    // navegador no sabe generar WebP, devuelve PNG y se usa ese. Con fondo -> JPEG.
    const blob = await aBlob(c, transparente ? "image/webp" : "image/jpeg", 0.9);
    const tipo = blob.type || (transparente ? "image/png" : "image/jpeg");
    const ext = tipo === "image/webp" ? ".webp" : tipo === "image/png" ? ".png" : ".jpg";
    const nombre = (archivo?.name.replace(/\.[^.]+$/, "") || "foto") + ext;
    return new File([blob], nombre, { type: tipo });
  };

  const guardar = async () => {
    setOcupado("Preparando…");
    try { onSiguiente(await exportar()); }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo preparar la foto"); }
    finally { setOcupado(null); }
  };

  // Esc cierra
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !ocupado) onCancelar(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [ocupado, onCancelar]);

  const editado = grados !== 0 || usarSinFondo || rect.x > 0.001 || rect.y > 0.001 || rect.w < 0.999 || rect.h < 0.999;
  const asas = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
  const pos: Record<string, string> = {
    nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize", n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
    ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize", e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
    se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize", s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
    sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize", w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  };
  const chip = (on: boolean) => cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-40",
    on ? "border-primary/60 bg-primary/15 text-fg" : "border-white/10 text-muted hover:text-fg");

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Editar foto antes de subir" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm" />
      <div className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-bg-soft shadow-modal">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg">Editar foto antes de subir{total > 1 ? ` · ${n} de ${total}` : ""}</p>
            <p className="truncate text-xs text-muted">{archivo.name} · arrastra el recuadro o sus bordes para recortar</p>
          </div>
          <button type="button" onClick={onCancelar} disabled={!!ocupado} aria-label="Cancelar"
            className="rounded-md p-1.5 text-muted hover:bg-white/10 hover:text-fg"><X className="h-5 w-5" /></button>
        </div>

        {/* Herramientas */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <button type="button" className={chip(usarSinFondo)} disabled={!!ocupado || !fondoDisponible} onClick={hacerSinFondo}
            title={fondoDisponible ? "Quitar el fondo (en tu PC, gratis)" : "Quitar fondo no está instalado en el backend"}>
            <Eraser className="h-3.5 w-3.5" /> {usarSinFondo ? "Sin fondo ✓" : "Quitar fondo"}
          </button>
          {usarSinFondo && (
            <div className="inline-flex rounded-full border border-white/10 p-0.5 text-xs">
              <button type="button" onClick={() => setBlanco(true)} className={cn("rounded-full px-2.5 py-1", blanco ? "bg-white text-black" : "text-muted")}>Fondo blanco</button>
              <button type="button" onClick={() => setBlanco(false)} className={cn("rounded-full px-2.5 py-1", !blanco ? "bg-primary text-white" : "text-muted")}>Transparente</button>
            </div>
          )}
          <button type="button" className={chip(false)} disabled={!!ocupado || !usarSinFondo} onClick={ajustarAlProducto}
            title="Recorta justo alrededor del producto (necesita quitar el fondo)"><Maximize className="h-3.5 w-3.5" /> Ajustar al producto</button>
          <button type="button" className={chip(cuadrado)} disabled={!!ocupado}
            onClick={() => { const c = !cuadrado; setCuadrado(c); if (c) setRect((r) => { const ratio = nat.w / nat.h; const lado = Math.min(r.w, r.h / ratio); return { ...r, w: lado, h: lado * ratio }; }); }}>
            <Square className="h-3.5 w-3.5" /> Cuadrado
          </button>
          <button type="button" className={chip(false)} disabled={!!ocupado} onClick={() => { setGrados((g) => (g + 90) % 360); setRect(TODO); }}>
            <RotateCw className="h-3.5 w-3.5" /> Girar
          </button>
          <button type="button" className={chip(false)} disabled={!!ocupado || !editado}
            onClick={() => { setGrados(0); setRect(TODO); setUsarSinFondo(false); setCuadrado(false); }}>
            <Undo2 className="h-3.5 w-3.5" /> Deshacer todo
          </button>
        </div>

        {/* Lienzo */}
        <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden p-6"
          style={{ background: "repeating-conic-gradient(#2a2f3a 0 25%, #222731 0 50%) 0 0 / 20px 20px" }}>
          {trabajo && (
            <div ref={caja} className="relative inline-block select-none" onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}>
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen local en edición */}
              <img src={trabajo} alt="" draggable={false} onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                className={cn("block max-h-[55vh] max-w-full", usarSinFondo && blanco && "bg-white")} />
              {/* zona fuera del recorte */}
              {[
                { left: 0, top: 0, width: "100%", height: `${rect.y * 100}%` },
                { left: 0, top: `${(rect.y + rect.h) * 100}%`, width: "100%", bottom: 0 },
                { left: 0, top: `${rect.y * 100}%`, width: `${rect.x * 100}%`, height: `${rect.h * 100}%` },
                { left: `${(rect.x + rect.w) * 100}%`, top: `${rect.y * 100}%`, right: 0, height: `${rect.h * 100}%` },
              ].map((st, i) => (
                <div key={i} className="pointer-events-none absolute bg-black/55" style={st} />
              ))}
              {/* recuadro de recorte */}
              <div className="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.6)]" data-modo="mover" onPointerDown={empezar}
                style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }}>
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }, (_, i) => <span key={i} className="border border-white/25" />)}
                </div>
                {asas.map((a) => (
                  <span key={a} data-modo={a} onPointerDown={empezar}
                    className={cn("absolute h-3.5 w-3.5 rounded-sm border-2 border-white bg-primary", pos[a])} />
                ))}
              </div>
            </div>
          )}
          {ocupado && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {ocupado}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <span className="mr-auto flex items-center gap-1.5 text-xs text-muted">
            <Crop className="h-3.5 w-3.5" /> {Math.round(rect.w * nat.w)} × {Math.round(rect.h * nat.h)} px
          </span>
          <Button variant="ghost" disabled={!!ocupado} onClick={onCancelar}>Cancelar</Button>
          <Button variant="outline" disabled={!!ocupado} onClick={() => onSiguiente(archivo)} title="Sube la foto tal cual, sin cambios">
            Subir sin editar
          </Button>
          <Button disabled={!!ocupado || !trabajo} onClick={guardar}>
            {n < total ? "Guardar y seguir" : "Guardar y subir"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
