// Quitar el fondo de una foto EN EL NAVEGADOR de quien la sube (gratis, sin servidor).
//
// Modelo: ISNet general-use (el mismo que usa rembg), licencia MIT, en ONNX publicado por
// img.ly en Hugging Face. Se baja una sola vez desde Hugging Face y queda guardado en la caché
// del navegador. El motor (onnxruntime-web, MIT) trae sus .wasm desde jsDelivr. Nada pasa por
// Vercel ni Render: ni el modelo, ni el motor, ni la foto.
//
// Con tarjeta gráfica (WebGPU) usa el modelo fp16 (~88 MB); si la tarjeta no puede, usa el
// procesador con el modelo fp32 (~176 MB). Se eligió ISNet (red convolucional) y no BiRefNet
// porque BiRefNet no corre en GPUs con 16 buffers por shader y se queda sin memoria en CPU.

const ORT_VERSION = "1.31.1"; // misma versión que package.json
const REPO = "https://huggingface.co/imgly/isnet-general-onnx/resolve/main/onnx";
const MODELOS = {
  webgpu: { url: `${REPO}/model_fp16.onnx`, mb: 88 },
  wasm: { url: `${REPO}/model.onnx`, mb: 176 },
} as const;
const LADO = 1024;                                   // entrada del modelo: 1024 × 1024
// Normalización de ISNet (preprocessor_config de img.ly; equivale a la de rembg): (px - 128) / 256
const MEDIA = 128;
const DESV = 256;
const CACHE = "kawii-modelos-v2";
const CACHES_VIEJAS = ["kawii-modelos-v1"];          // BiRefNet: se borra para liberar espacio

type Ort = typeof import("onnxruntime-web/webgpu");
type Sesion = import("onnxruntime-web").InferenceSession;
export type Progreso = (texto: string) => void;

let sesion: Promise<{ ort: Ort; s: Sesion; motor: "webgpu" | "wasm" }> | null = null;

// Si la tarjeta gráfica de esta PC no puede con el modelo (p. ej. límite de 16 buffers en
// algunas AMD), se recuerda y las próximas veces se usa directo el procesador.
const SIN_GPU = "kawii.fondo.sinGpu";
function gpuDescartada(): boolean {
  try { return localStorage.getItem(SIN_GPU) === "1"; } catch { return false; }
}
function descartarGpu(): void {
  try { localStorage.setItem(SIN_GPU, "1"); } catch { /* sin almacenamiento: se reintenta la próxima vez */ }
}

/** ¿Este navegador puede quitar el fondo en local? */
export function quitarFondoLocalDisponible(): boolean {
  return typeof window !== "undefined" && typeof WebAssembly === "object";
}

/** Baja el modelo (o lo toma de la caché del navegador), informando el avance. */
async function bajarModelo(url: string, mb: number, avisar: Progreso): Promise<ArrayBuffer> {
  let cache: Cache | null = null;
  try { cache = await caches.open(CACHE); } catch { /* sin Cache API: se baja sin guardar */ }
  const guardado = await cache?.match(url);
  if (guardado) {
    avisar("Cargando el modelo de IA…");
    return guardado.arrayBuffer();
  }
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`No se pudo descargar el modelo (error ${res.status})`);
  const total = Number(res.headers.get("content-length")) || mb * 1_000_000;
  const lector = res.body.getReader();
  const partes: Uint8Array[] = [];
  let bajado = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    partes.push(value);
    bajado += value.length;
    avisar(`Descargando el modelo de IA (solo la primera vez)… ${Math.min(99, Math.round((bajado / total) * 100))}%`);
  }
  const buf = new Uint8Array(bajado);
  let o = 0;
  for (const p of partes) { buf.set(p, o); o += p.length; }
  // Pide al navegador que no borre esta caché cuando le falte espacio (si no, a veces se vuelve a bajar).
  try { await navigator.storage?.persist?.(); } catch { /* no disponible */ }
  try { await cache?.put(url, new Response(buf, { headers: { "content-type": "application/octet-stream" } })); }
  catch { /* sin espacio en caché: la próxima vez se vuelve a bajar */ }
  return buf.buffer;
}

async function crearSesion(avisar: Progreso, soloCpu = false) {
  for (const vieja of CACHES_VIEJAS) caches.delete(vieja).catch(() => {});
  const ort: Ort = await import("onnxruntime-web/webgpu");
  // Los .wasm del motor vienen de jsDelivr (no de nuestro servidor).
  ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
  const gpu = !soloCpu && !gpuDescartada() && typeof navigator !== "undefined" && "gpu" in navigator
    && !!(await (navigator as unknown as { gpu: { requestAdapter(): Promise<unknown> } }).gpu.requestAdapter().catch(() => null));
  if (gpu) {
    try {
      const m = await bajarModelo(MODELOS.webgpu.url, MODELOS.webgpu.mb, avisar);
      avisar("Preparando la tarjeta gráfica…");
      // Sin "fusiones" del grafo: las operaciones fusionadas piden más de 16 buffers y hay
      // tarjetas (p. ej. AMD GCN) que no las admiten.
      const s = await ort.InferenceSession.create(m, { executionProviders: ["webgpu"], graphOptimizationLevel: "basic" });
      return { ort, s, motor: "webgpu" as const };
    } catch { descartarGpu(); /* WebGPU no sirvió: seguimos con el procesador */ }
  }
  const m = await bajarModelo(MODELOS.wasm.url, MODELOS.wasm.mb, avisar);
  avisar("Preparando el modelo…");
  // Sin reservar memoria extra: el motor en el navegador tiene un tope de 4 GB.
  const s = await ort.InferenceSession.create(m, {
    executionProviders: ["wasm"], enableCpuMemArena: false, enableMemPattern: false, graphOptimizationLevel: "basic",
  });
  return { ort, s, motor: "wasm" as const };
}

// ── half precision (fp16): el modelo de 115 MB recibe y devuelve float16 ──
const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);
function aF16(v: number): number {
  f32[0] = v;
  const x = u32[0];
  const signo = (x >>> 16) & 0x8000;
  const e = ((x >>> 23) & 0xff) - 127 + 15;
  const m = x & 0x7fffff;
  if (e <= 0) return signo;                                  // muy chico -> 0
  if (e >= 31) return signo | 0x7c00;                        // muy grande -> infinito
  return signo | (e << 10) | (m >>> 13);
}
function deF16(h: number): number {
  const s = h & 0x8000 ? -1 : 1, e = (h >>> 10) & 0x1f, m = h & 0x3ff;
  if (e === 0) return s * 2 ** -14 * (m / 1024);
  if (e === 31) return m ? NaN : s * Infinity;
  return s * 2 ** (e - 15) * (1 + m / 1024);
}

/** Tipo de dato que espera la entrada del modelo ("float16" o "float32"). */
function tipoEntrada(s: Sesion): string {
  const meta = (s as unknown as { inputMetadata?: { type?: string }[] }).inputMetadata;
  return meta?.[0]?.type ?? "float32";
}

function cargarImagen(src: Blob): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(src);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); ok(im); };
    im.onerror = () => { URL.revokeObjectURL(url); mal(new Error("No se pudo leer la foto")); };
    im.src = url;
  });
}

/** Devuelve la foto con el fondo transparente (PNG), procesada en este navegador. */
export async function quitarFondoLocal(foto: Blob, avisar: Progreso = () => {}): Promise<Blob> {
  if (!sesion) sesion = crearSesion(avisar).catch((e) => { sesion = null; throw e; });
  const actual = await sesion;
  try {
    return await procesar(foto, actual, avisar);
  } catch (e) {
    if (actual.motor !== "webgpu") throw e;
    // La tarjeta gráfica no pudo (límites de esta GPU): se pasa al procesador, en el navegador.
    descartarGpu();
    try { await actual.s.release(); } catch { /* ya liberada */ }
    sesion = crearSesion(avisar, true).catch((err) => { sesion = null; throw err; });
    return procesar(foto, await sesion, avisar);
  }
}

async function procesar(foto: Blob, { ort, s, motor }: { ort: Ort; s: Sesion; motor: "webgpu" | "wasm" },
                        avisar: Progreso): Promise<Blob> {
  avisar(motor === "webgpu" ? "Quitando el fondo (tarjeta gráfica)…" : "Quitando el fondo (procesador, unos segundos)…");

  const im = await cargarImagen(foto);
  const W = im.naturalWidth, H = im.naturalHeight;

  // 1) Entrada: 1024×1024, normalizada (media/desvío de ImageNet), formato CHW.
  const c = document.createElement("canvas");
  c.width = LADO; c.height = LADO;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(im, 0, 0, LADO, LADO);
  const px = g.getImageData(0, 0, LADO, LADO).data;
  const n = LADO * LADO;
  const entrada = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) entrada[k * n + i] = (px[i * 4 + k] - MEDIA) / DESV;
  }
  const nombreEntrada = s.inputNames[0];
  const tensor = tipoEntrada(s) === "float16"
    ? new ort.Tensor("float16", Uint16Array.from(entrada, aF16), [1, 3, LADO, LADO])
    : new ort.Tensor("float32", entrada, [1, 3, LADO, LADO]);
  const salidas = await s.run({ [nombreEntrada]: tensor });
  const t = salidas[s.outputNames[0]];             // ISNet: la primera salida es la máscara final
  // La salida puede venir en float16 (Uint16Array o Float16Array) o en float32.
  const crudo = (t.type === "float16" && t.data instanceof Uint16Array)
    ? Float32Array.from(t.data as Uint16Array, deF16)
    : Float32Array.from(t.data as ArrayLike<number>);
  // Como rembg: la máscara se lleva a 0..1 con mínimo y máximo.
  let mi = Infinity, ma = -Infinity;
  for (let i = 0; i < crudo.length; i++) { const v = crudo[i]; if (v < mi) mi = v; if (v > ma) ma = v; }
  const rango = ma - mi || 1;
  const datos = crudo;

  // 2) Máscara en 1024×1024 → escalada al tamaño original.
  const mc = document.createElement("canvas");
  mc.width = LADO; mc.height = LADO;
  const mg = mc.getContext("2d")!;
  const mascara = mg.createImageData(LADO, LADO);
  for (let i = 0; i < n; i++) {
    const a = Math.round(((datos[i] - mi) / rango) * 255);
    mascara.data[i * 4] = 255; mascara.data[i * 4 + 1] = 255; mascara.data[i * 4 + 2] = 255; mascara.data[i * 4 + 3] = a;
  }
  mg.putImageData(mascara, 0, 0);

  // 3) La foto original con la máscara como transparencia.
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const og = out.getContext("2d", { willReadFrequently: true })!;
  og.drawImage(mc, 0, 0, W, H);
  const alfa = og.getImageData(0, 0, W, H).data;
  og.clearRect(0, 0, W, H);
  og.drawImage(im, 0, 0);
  const img = og.getImageData(0, 0, W, H);
  for (let i = 0; i < W * H; i++) img.data[i * 4 + 3] = alfa[i * 4 + 3];
  og.putImageData(img, 0, 0);
  return new Promise((ok, mal) => out.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo generar la imagen"))), "image/png"));
}
