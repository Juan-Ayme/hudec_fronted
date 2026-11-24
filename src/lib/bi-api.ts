// Cliente HTTP para los endpoints de administración de costos y category targets.
//
// Multi-tenant: reusa el `request` de api.ts, que ya inyecta el header
// X-Company-Id desde localStorage.

import { request, API_BASE_URL, buildQuery, readActiveCompanyId } from "./api";
import type {
  CategoryTargetPatch,
  CategoryTargetUpdateResult,
  CategoryTargetsList,
  VariantCostAudit,
  VariantCostBackfillResult,
  VariantCostByOfficeParams,
  VariantCostHealthResponse,
} from "@/lib/bi-types";

// ──────────────────────────── Admin — Category Targets ────────────────────────────

/** Lista los targets configurados. Filtrable por sucursal. */
export const listCategoryTargets = (
  office_id?: number | null,
  signal?: AbortSignal,
) =>
  request<CategoryTargetsList>("/config/category-targets", {
    query: { office_id: office_id ?? undefined },
    signal,
  });

/** Edición parcial de un target — solo se modifican los campos enviados. */
export const updateCategoryTarget = (
  category_id: number,
  office_id: number,
  patch: CategoryTargetPatch,
) =>
  request<CategoryTargetUpdateResult>(
    `/config/category-targets/${category_id}/${office_id}`,
    { method: "PUT", body: patch },
  );

/** Elimina un target por (category_id, office_id). */
export const deleteCategoryTarget = (category_id: number, office_id: number) =>
  request<{ ok: true }>(
    `/config/category-targets/${category_id}/${office_id}`,
    { method: "DELETE" },
  );

// ──────────────────────────── Admin — Variant Costs ────────────────────────────

/** Auditoría de cobertura de costos (variantes activas + venta últ. 90d). */
export const getVariantCostsAudit = (signal?: AbortSignal) =>
  request<VariantCostAudit>("/config/variant-costs/audit", { signal });

/**
 * Backfill de costos desde recepciones. Idempotente.
 * dry_run=true → solo devuelve el diff; dry_run=false → escribe.
 */
export const backfillVariantCosts = (dry_run: boolean) =>
  request<VariantCostBackfillResult>(
    "/config/variant-costs/backfill-from-receptions",
    { method: "POST", query: { dry_run } },
  );

/** Compra con costo >= precio de venta: error de carga a corregir en BSale. */
export interface CostoMalCargado {
  sku: string;
  producto: string;
  office_id: number;
  sucursal: string;
  fecha: string | null;
  recepcion: number;
  nota: string;
  cantidad: number;
  costo_cargado: number;
  precio_venta: number;
  veces_precio: number;
  costo_que_usa_el_sistema: number | null;
  stock_actual: number | null;
}

export interface CostosMalCargados {
  total: number;
  productos: number;
  por_sucursal: Record<string, number>;
  criterio: string;
  detalle: CostoMalCargado[];
}

/** Compras mal cargadas en BSale (costo >= precio de venta), últimos `meses`. */
export const getCostosMalCargados = (meses = 12, signal?: AbortSignal) =>
  request<CostosMalCargados>("/config/variant-costs/mal-cargados", { query: { meses }, signal });

export const costosMalCargadosExcelUrl = (meses = 12) =>
  `${API_BASE_URL}/config/variant-costs/mal-cargados/export?meses=${meses}`;

/** Análisis de salud de costos por sucursal. */
export const getVariantCostsByOffice = (
  params: VariantCostByOfficeParams = {},
  signal?: AbortSignal,
) =>
  request<VariantCostHealthResponse>("/config/variant-costs/by-office", {
    query: {
      office_id: params.office_id ?? undefined,
      page: params.page ?? 1,
      page_size: params.page_size ?? 100,
      days: params.days,
      umbral_margen_bajo: params.umbral_margen_bajo,
      umbral_margen_alto: params.umbral_margen_alto,
      umbral_outlier_pct: params.umbral_outlier_pct,
      umbral_desactualizado_pct: params.umbral_desactualizado_pct,
      umbral_ratio_max_min: params.umbral_ratio_max_min,
      solo_problemas: params.solo_problemas,
      incluir_igv_en_margen: params.incluir_igv_en_margen,
    },
    signal,
  });

/** Descarga el reporte de Excel con problemas de costos. */
export const exportVariantCostsExcel = async (
  params: VariantCostByOfficeParams = {},
  signal?: AbortSignal,
) => {
  const query = {
    office_id: params.office_id ?? undefined,
    days: params.days,
    umbral_margen_bajo: params.umbral_margen_bajo,
    umbral_margen_alto: params.umbral_margen_alto,
    umbral_outlier_pct: params.umbral_outlier_pct,
    umbral_desactualizado_pct: params.umbral_desactualizado_pct,
    umbral_ratio_max_min: params.umbral_ratio_max_min,
    solo_problemas: params.solo_problemas,
    incluir_igv_en_margen: params.incluir_igv_en_margen,
  };
  const url = `${API_BASE_URL}/config/variant-costs/by-office/export${buildQuery(query as Record<string, string | number | boolean | null | undefined>)}`;
  const headers: Record<string, string> = {};
  const companyId = readActiveCompanyId();
  if (companyId !== null) headers["X-Company-Id"] = String(companyId);

  const res = await fetch(url, {
    headers,
    signal,
    credentials: "include",
  });
  if (!res.ok) throw new Error("No se pudo exportar el Excel");

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `auditoria_costos_${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

// ──────────────────────── Query keys (para @tanstack/react-query) ────────────────────────

export const biQueryKeys = {
  all: ["bi"] as const,
  categoryTargets: (office_id: number | null) =>
    ["bi", "category-targets", office_id] as const,
  variantCostsAudit: () => ["bi", "variant-costs", "audit"] as const,
  variantCostsByOffice: (params: VariantCostByOfficeParams) =>
    ["bi", "variant-costs", "by-office", params] as const,
} as const;

export type {
  CategoryTarget,
  CategoryTargetPatch,
  CategoryTargetsList,
  CategoryTargetUpdateResult,
  VariantCostAudit,
  VariantCostBackfillResult,
  VariantCostByOfficeParams,
  VariantCostHealthResponse,
} from "@/lib/bi-types";
