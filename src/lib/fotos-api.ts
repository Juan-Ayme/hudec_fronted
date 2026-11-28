// Fotos del catálogo (`/product-images/*` del backend): hasta 4 fotos por SKU (variante),
// guardadas en Cloudinary; la posición 1 es la principal. También el color de muestra del SKU
// (cualquier tono, "#rrggbb"), que el catálogo dibuja como círculos.

import { API_BASE_URL, ApiError, readActiveCompanyId, request } from "./api";

export interface FotoSku {
  posicion: number;
  url: string;
  thumb_url: string;
}

export interface SkuFoto {
  variant_id: number;
  product_id: number;
  sku: string | null;
  /** "Producto - Variante" (o solo el producto). */
  nombre: string;
  departamento: string;
  categoria: string;
  stock: number;
  /** Hasta 4, ordenadas por posición (la primera es la principal). */
  fotos: FotoSku[];
  url: string | null;
  thumb_url: string | null;
  /** Primer color de muestra, "#rrggbb", o null. */
  color: string | null;
  /** Todos los colores de muestra, en orden (SKU surtido: varios). */
  colores?: string[];
}

/** Máximo de colores de muestra por SKU (igual que el backend). */
export const MAX_COLORES = 12;

export interface ListaSkusFoto {
  total: number;
  max_fotos: number;
  items: SkuFoto[];
  storage_configured: boolean;
}

export interface EstadoFotos {
  storage_configured: boolean;
  max_fotos: number;
  /** El backend tiene instalado "quitar fondo" (rembg, local). */
  quitar_fondo: boolean;
  productos: number;
  productos_con_foto: number;
  skus: number;
  skus_con_foto: number;
}

export type FiltroFoto = "todos" | "sin_foto" | "con_foto";

export interface ParamsSkusFoto {
  q: string;
  departamento: string | null;
  estado: FiltroFoto;
  limit: number;
}

export const fotosQueryKeys = {
  all: ["fotos"] as const,
  estado: () => ["fotos", "estado"] as const,
  skus: (p: ParamsSkusFoto) => ["fotos", "skus", p] as const,
};

export const getEstadoFotos = (signal?: AbortSignal) =>
  request<EstadoFotos>("/product-images/status", { signal });

export const getSkusFoto = (p: ParamsSkusFoto, signal?: AbortSignal) =>
  request<ListaSkusFoto>("/product-images/skus", {
    signal,
    query: {
      q: p.q.trim() || undefined,
      departamento: p.departamento ?? undefined,
      estado: p.estado,
      limit: p.limit,
    },
  });

/** Llamada de escritura sobre un SKU; devuelve el SKU actualizado. */
async function enviar(method: "PUT" | "POST" | "DELETE", ruta: string, body?: FormData | object): Promise<SkuFoto> {
  const headers: Record<string, string> = {};
  const companyId = readActiveCompanyId();
  if (companyId !== null) headers["X-Company-Id"] = String(companyId);
  // Con FormData el navegador pone el Content-Type (boundary del multipart).
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE_URL}/product-images/variants/${ruta}`, {
    method, headers, body: payload, credentials: "include",
  });
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const j = await res.json();
      detail = j.detail ?? j.error ?? detail;
    } catch { /* respuesta sin JSON */ }
    throw new ApiError(res.status, typeof detail === "string" ? detail : `Error ${res.status}`);
  }
  return res.json();
}

/** Sube (o reemplaza) la foto del SKU en esa posición (1 = principal). JPG, PNG o WEBP, máx. 10 MB. */
export const subirFotoSku = (variantId: number, posicion: number, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return enviar("PUT", `${variantId}/fotos/${posicion}`, fd);
};

/** Quita esa foto (también de Cloudinary); las siguientes se corren. */
export const quitarFotoSku = (variantId: number, posicion: number) =>
  enviar("DELETE", `${variantId}/fotos/${posicion}`);

/** Pasa esa foto a principal (intercambia con la posición 1). */
export const hacerPrincipal = (variantId: number, posicion: number) =>
  enviar("POST", `${variantId}/fotos/${posicion}/principal`);

/** Color de muestra del SKU ("#rrggbb", cualquier tono); null = quitarlo. */
export const guardarColor = (variantId: number, color: string | null) =>
  enviar("PUT", `${variantId}/color`, { color });

/** Varios colores de muestra del SKU, en orden; [] = quitarlos todos. */
export const guardarColores = (variantId: number, colores: string[]) =>
  enviar("PUT", `${variantId}/color`, { colores });

/** Quita el fondo en el backend (local, rembg). Devuelve un PNG transparente; no guarda nada. */
export async function quitarFondo(file: Blob): Promise<Blob> {
  const headers: Record<string, string> = {};
  const companyId = readActiveCompanyId();
  if (companyId !== null) headers["X-Company-Id"] = String(companyId);
  const fd = new FormData();
  fd.append("file", file, file instanceof File ? file.name : "foto.png");
  const res = await fetch(`${API_BASE_URL}/product-images/quitar-fondo`, {
    method: "POST", headers, body: fd, credentials: "include",
  });
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const j = await res.json();
      detail = j.detail ?? j.error ?? detail;
    } catch { /* respuesta sin JSON */ }
    throw new ApiError(res.status, typeof detail === "string" ? detail : `Error ${res.status}`);
  }
  return res.blob();
}

export const TIPOS_FOTO =["image/jpeg", "image/png", "image/webp"];
export const MAX_FOTO_MB = 10;

// ── Fotos pendientes: productos que todavía no están en BSale (o sin stock) ──
// Se suben con el código que tendrá el SKU; el sync las pega solas cuando el SKU existe y tiene stock.

export interface FotoPendiente {
  id: number;
  /** Código en minúscula (así se compara con el SKU o el código de barras). */
  codigo: string;
  posicion: number;
  url: string;
  thumb_url: string;
  created_at: string;
  vence_el: string;
  /** SKU activos que ya tienen ese código (0 = el producto aún no está en BSale). */
  skus_con_codigo: number;
}

export interface ListaPendientes {
  items: FotoPendiente[];
  dias_vence: number;
  max_fotos: number;
  storage_configured: boolean;
}

export interface ResultadoPendiente {
  estado: "pegada" | "pendiente";
  mensaje: string;
  foto?: FotoPendiente;
  sku?: SkuFoto;
}

export const pendientesQueryKey = ["fotos", "pendientes"] as const;

export const getPendientes = (signal?: AbortSignal) =>
  request<ListaPendientes>("/product-images/pendientes", { signal });

async function enviarPendiente(method: "POST" | "DELETE", ruta: string, body?: FormData) {
  const headers: Record<string, string> = {};
  const companyId = readActiveCompanyId();
  if (companyId !== null) headers["X-Company-Id"] = String(companyId);
  const res = await fetch(`${API_BASE_URL}/product-images/pendientes${ruta}`, {
    method, headers, body, credentials: "include",
  });
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const j = await res.json();
      detail = j.detail ?? j.error ?? detail;
    } catch { /* respuesta sin JSON */ }
    throw new ApiError(res.status, typeof detail === "string" ? detail : `Error ${res.status}`);
  }
  return res.json();
}

/** Sube una foto por código. Si el SKU ya existe con stock, se pone directo en él. */
export const subirPendiente = (codigo: string, file: File): Promise<ResultadoPendiente> => {
  const fd = new FormData();
  fd.append("codigo", codigo);
  fd.append("file", file);
  return enviarPendiente("POST", "", fd);
};

/** Quita una foto pendiente (también de Cloudinary). */
export const quitarPendiente = (id: number): Promise<{ ok: boolean }> =>
  enviarPendiente("DELETE", `/${id}`);
