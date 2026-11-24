// Cliente de traslados entre sucursales (`/traslados/*` del backend).
//
// El almacenero pega desde Excel (SKU + cantidad, o SKU + una columna por
// tienda), el backend calcula con el stock EN VIVO de BSale y, al confirmar,
// crea el mismo "TRASLADO INTERNO" que hoy se hace a mano en BSale.

import { request } from "./api";

export interface SucursalTraslado {
  office_id: number;
  nombre: string;
  address: string | null;
  district: string | null;
  city: string | null;
  tiene_stock: boolean;
  puede_origen: boolean;
}

export type EstadoLinea = "ok" | "insuficiente" | "sin_stock" | "no_existe" | "sin_dato";

export interface LineaTraslado {
  sku: string;
  variant_id: number | null;
  producto: string | null;
  /** destino (office_id como string) → unidades */
  cantidades: Record<string, number>;
  total: number;
  stock_origen: number | null;
  queda: number | null;
  estado: EstadoLinea;
  mensaje: string;
}

export interface ErrorPegado {
  linea: number;
  sku: string;
  mensaje: string;
}

export interface ValidacionTraslado {
  modo: "simple" | "reparto";
  origen_id?: number;
  lineas: LineaTraslado[];
  destinos: { office_id: number; nombre: string; lineas: number; unidades: number }[];
  errores: ErrorPegado[];
  avisos: string[];
  totales: { lineas: number; unidades: number; con_problema?: number };
  puede_emitir: boolean;
}

export interface TrasladoEmitido {
  shipping_id: number;
  guia_id: number | null;
  numero: number | null;
  url_pdf: string | null;
  destino_id: number;
  destino: string;
  lineas: number;
  unidades: number;
}

export interface ResultadoEmision {
  ok: boolean;
  emitidos: TrasladoEmitido[];
  error: { destino_id: number; destino: string; mensaje: string } | null;
  pendientes: number[];
}

export interface TrasladoHistorial {
  shipping_id: number;
  numero: number | null;
  fecha: number;
  origen_id: number;
  destino_id: number;
  origen: string;
  destino: string;
  recibido: boolean;
  lineas: number;
  unidades: number | null;
  total: number | null;
  url_pdf: string | null;
}

export const trasladosKeys = {
  sucursales: ["traslados", "sucursales"] as const,
  historial: ["traslados", "historial"] as const,
};

export const getSucursalesTraslado = (signal?: AbortSignal) =>
  request<{ sucursales: SucursalTraslado[] }>("/traslados/sucursales", { signal });

export const validarTraslado = (body: { origen_id: number; destino_id: number | null; texto: string }) =>
  request<ValidacionTraslado>("/traslados/validar", { method: "POST", body });

export const emitirTraslados = (body: {
  origen_id: number;
  request_id: string;
  traslados: { destino_id: number; items: { variant_id: number; cantidad: number }[] }[];
}) => request<ResultadoEmision>("/traslados/emitir", { method: "POST", body });

export const getHistorialTraslados = (signal?: AbortSignal) =>
  request<{ traslados: TrasladoHistorial[] }>("/traslados/historial", { signal, query: { limite: 30 } });
