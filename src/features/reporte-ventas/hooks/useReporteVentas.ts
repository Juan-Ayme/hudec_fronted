"use client";

import { useMemo, useState } from "react";
import { API_BASE_URL, buildQuery, readActiveCompanyId, request } from "@/lib/api";
import { useSucursal } from "@/components/sucursal-context";
import { useBIQuery } from "@/features/bi/shared";

/* ─── Tipos: espejo de GET /analytics/reporte-ventas ─── */

/**
 * Métricas comunes a producto / categoría / departamento / totales.
 *
 * OJO con la base del margen: acá `ganancia = ingresos CON IGV − costo` y
 * `margen_pct = ganancia / ingresos CON IGV`. Es distinto del resto del
 * backend (Rentabilidad, Diagnóstico), que usa el margen contable sobre venta
 * neta. La diferencia es deliberada: el IGV cobrado se queda en la empresa y
 * los proveedores no facturan IGV. Ver el docstring de
 * `app/routers/reporte_ventas.py` antes de comparar contra otra vista.
 */
interface ReporteMetricas {
  unidades: number;
  /** Con IGV — es la base del margen en este reporte. */
  ingresos: number;
  /** Sin IGV, como lo reporta BSale. Informativo. */
  ingresos_netos: number;
  /** IGV contenido en `ingresos`. Siempre `ingresos − ingresos_netos`. */
  igv: number;
  costo: number;
  /** `ingresos − costo`. */
  ganancia: number;
  /** `ganancia / ingresos`. */
  margen_pct: number;
  /** `ganancia / costo` — la lente del comprador para fijar precios. */
  markup_pct: number;
}

export interface ReporteProducto extends ReporteMetricas {
  sku: string;
  producto: string;
  /** % sobre los ingresos de SU categoría. */
  participacion_pct: number;
}

export interface ReporteCategoria extends ReporteMetricas {
  categoria: string;
  /** % sobre los ingresos de SU departamento. */
  participacion_pct: number;
  productos: ReporteProducto[];
}

export interface ReporteDepartamento extends ReporteMetricas {
  departamento: string;
  /** % sobre los ingresos totales del reporte. */
  participacion_pct: number;
  tickets: number;
  ticket_promedio: number;
  categorias: ReporteCategoria[];
}

export interface ReporteVentas {
  meta: {
    empresa: string;
    desde: string;
    hasta: string;
    dias: number;
    sucursal: string;
    office_ids: number[];
    generado_en: string;
  };
  totales: ReporteMetricas & {
    tickets: number;
    ticket_promedio: number;
  };
  serie_diaria: { fecha: string; ingresos: number; tickets: number }[];
  departamentos: ReporteDepartamento[];
}

/* ─── Rango de fechas ─── */

/** `YYYY-MM-DD` en hora LOCAL. `toISOString()` pasa a UTC y puede correr el día. */
function isoLocal(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** DateRangeSelect emite un conteo de días que SIEMPRE termina hoy. */
export function rangoDesdeDias(days: number): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const desde = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate() - (days - 1));
  return { desde: isoLocal(desde), hasta: isoLocal(hasta) };
}

/* ─── Descarga del Excel ─── */

/**
 * Baja el .xlsx. No usa `request()` porque ese helper parsea la respuesta como
 * texto/JSON, y acá el body es binario: hay que leerlo como blob.
 */
export async function descargarExcel(params: {
  desde: string;
  hasta: string;
  officeId: number | null;
}): Promise<void> {
  const qs = buildQuery({
    start_date: params.desde,
    end_date: params.hasta,
    office_id: params.officeId ?? undefined,
  });
  const companyId = readActiveCompanyId();

  const res = await fetch(`${API_BASE_URL}/analytics/reporte-ventas/excel${qs}`, {
    headers: companyId !== null ? { "X-Company-Id": String(companyId) } : {},
    credentials: "include",
  });

  if (!res.ok) {
    // El backend manda 400 (rango inválido) y 503 (timeout) con `detail`.
    let detalle = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detalle = body.detail;
    } catch {
      /* respuesta sin JSON: nos quedamos con el status */
    }
    throw new Error(detalle);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Reporte_Ventas_${params.desde}_${params.hasta}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/* ─── Hook ─── */

export function useReporteVentas() {
  const { officeId } = useSucursal();
  const [days, setDays] = useState(30);

  const { desde, hasta } = useMemo(() => rangoDesdeDias(days), [days]);

  const reporteQ = useBIQuery<ReporteVentas>({
    queryKey: ["bi", "reporte-ventas", officeId, desde, hasta],
    queryFn: ({ signal }) =>
      request<ReporteVentas>("/analytics/reporte-ventas", {
        query: {
          start_date: desde,
          end_date: hasta,
          office_id: officeId ?? undefined,
        },
        signal,
      }),
  });

  return { days, setDays, desde, hasta, officeId, reporteQ };
}
