// Cliente HTTP para los endpoints del módulo BI (Pulso / Diagnóstico /
// Salud del Catálogo / Plan del Mes) + admin de configuración.
//
// Multi-tenant: reusa el `request` de api.ts, que ya inyecta el header
// X-Company-Id desde localStorage. NO hay que pasar company_id acá.
// El único filtro por sucursal es `office_id` (null = todas las tiendas del scope).

import { request } from "@/lib/api";
import type {
  CatalogHealthResponse,
  CategoryTargetPatch,
  CategoryTargetUpdateResult,
  CategoryTargetsBootstrapResult,
  CategoryTargetsList,
  CategoryTargetsPreview,
  DiagnosisResponse,
  PlanResponse,
  PulseResponse,
  VariantCostAudit,
  VariantCostBackfillResult,
} from "@/lib/bi-types";

// ────────────────────────────── Vistas principales ──────────────────────────────

/** Vista 1 — Pulso: "¿Cómo voy hoy?". Snapshot rápido del mes en curso, veredicto y alertas. */
export const getPulse = (
  office_id: number | null,
  signal?: AbortSignal,
) =>
  request<PulseResponse>("/pulse", {
    query: { office_id: office_id ?? undefined },
    signal,
  });

export interface DiagnosisParams {
  days?: number;         // 1-90, default 7
  office_id?: number | null;
  top_n?: number;        // 1-50, default 10
}

/** Vista 2 — Diagnóstico: "¿Por qué vendo menos hoy?". Drivers y descomposición. */
export const getDiagnosis = (
  params: DiagnosisParams = {},
  signal?: AbortSignal,
) =>
  request<DiagnosisResponse>("/diagnosis", {
    query: {
      days: params.days,
      office_id: params.office_id ?? undefined,
      top_n: params.top_n,
    },
    signal,
  });

export interface CatalogHealthParams {
  office_id?: number | null;
  top_n?: number;        // 1-100, default 15
}

/** Vista 3 — Salud del Catálogo: 80/20, huecos, capital atrapado, descuentos. */
export const getCatalogHealth = (
  params: CatalogHealthParams = {},
  signal?: AbortSignal,
) =>
  request<CatalogHealthResponse>("/catalog-health", {
    query: {
      office_id: params.office_id ?? undefined,
      top_n: params.top_n,
    },
    signal,
  });

export interface PlanParams {
  office_id?: number | null;
  meses_calendario?: number; // 1-12, default 6
}

/** Vista 4 — Plan del Mes: proyección, sugerencia de meta, pacing, presupuesto. */
export const getPlan = (
  params: PlanParams = {},
  signal?: AbortSignal,
) =>
  request<PlanResponse>("/plan", {
    query: {
      office_id: params.office_id ?? undefined,
      meses_calendario: params.meses_calendario,
    },
    signal,
  });

// ──────────────────────────── Admin — Category Targets ────────────────────────────
// (Metas del mes viven en api.ts como getGoals/setGoals; no se duplican acá.)

/** Lista los targets configurados. Filtrable por sucursal. */
export const listCategoryTargets = (
  office_id?: number | null,
  signal?: AbortSignal,
) =>
  request<CategoryTargetsList>("/config/category-targets", {
    query: { office_id: office_id ?? undefined },
    signal,
  });

/** Preview de lo que insertaría el bootstrap. No muta nada. */
export const previewCategoryTargets = (signal?: AbortSignal) =>
  request<CategoryTargetsPreview>("/config/category-targets/preview", {
    signal,
  });

/**
 * Carga inicial (o reset con force) de targets sugeridos automáticamente.
 * Idempotente cuando la tabla está vacía. Con datos + force=false → 409 Conflict.
 */
export const bootstrapCategoryTargets = (force = false) =>
  request<CategoryTargetsBootstrapResult>(
    "/config/category-targets/bootstrap",
    { method: "POST", query: { force } },
  );

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
 * Nota: desde la tarea #24 el sync nocturno ya lo hace; queda como herramienta manual.
 */
export const backfillVariantCosts = (dry_run: boolean) =>
  request<VariantCostBackfillResult>(
    "/config/variant-costs/backfill-from-receptions",
    { method: "POST", query: { dry_run } },
  );

// ──────────────────────── Query keys (para @tanstack/react-query) ────────────────────────
// Centralizados para invalidar todo el módulo BI de una sola vez cuando cambia la
// empresa activa. Usan un array simple; sumarles el office_id/params en cada page.

export const biQueryKeys = {
  all: ["bi"] as const,
  pulse: (office_id: number | null) => ["bi", "pulse", office_id] as const,
  diagnosis: (office_id: number | null, days: number | undefined, top_n: number | undefined) =>
    ["bi", "diagnosis", office_id, days, top_n] as const,
  catalogHealth: (office_id: number | null, top_n: number | undefined) =>
    ["bi", "catalog-health", office_id, top_n] as const,
  plan: (office_id: number | null, meses_calendario: number | undefined) =>
    ["bi", "plan", office_id, meses_calendario] as const,
  categoryTargets: (office_id: number | null) =>
    ["bi", "category-targets", office_id] as const,
  categoryTargetsPreview: () => ["bi", "category-targets", "preview"] as const,
  variantCostsAudit: () => ["bi", "variant-costs", "audit"] as const,
} as const;

/** Re-export tipos crudos por conveniencia (evita 2 imports desde las páginas). */
export type {
  CatalogHealthResponse,
  CategoryTarget,
  CategoryTargetPatch,
  CategoryTargetsBootstrapResult,
  CategoryTargetsList,
  CategoryTargetsPreview,
  CategoryTargetUpdateResult,
  DiagnosisResponse,
  PlanResponse,
  PulseResponse,
  VariantCostAudit,
  VariantCostBackfillResult,
} from "@/lib/bi-types";
