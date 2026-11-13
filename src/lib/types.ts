// Tipos de las respuestas de la API KAWII/HUDEC (FastAPI).
// Derivados de los routers del backend (app/routers/*, app/kawii_matrix/*).

// ---- Meta ----
export interface Health {
  status: string;
  db: string;
  db_version: string | null;
  app: string;
  version: string;
  productos_en_bd: number | null;
  timestamp: string;
}

// ---- Analytics ----
export interface Kpis {
  periodo_dias: number;
  ventas: number;
  tickets: number;
  tickets_con_monto: number;
  ticket_promedio: number;
  productos_total: number;
  productos_mapeados: number;
  variantes_total: number;
  stock_valorizado: number;
  sucursales: number;
}

export interface SalesByDay {
  dia: string;
  ventas: number;
  tickets: number;
  ticket_promedio: number | null;
}

// ---- Ticket Anatomy (descomposición del cambio en ventas) ----
// `decomposition_log_pct.tickets` + `unds_per_ticket` + `monto_per_und`
// suman EXACTAMENTE `decomposition_log_pct.total` (escala log).
// Útil para responder "¿la caída fue por tráfico, canasta o precio?".
export interface PeriodMetrics {
  from: string;            // YYYY-MM-DD inclusivo
  to: string;              // YYYY-MM-DD inclusivo
  ventas: number;
  tickets: number;
  unds: number;
  unds_per_ticket: number;
  monto_per_und: number;
  ticket_promedio: number;
  margen_pct: number;      // 0..100
  margen_monto: number;
  descuento_aplicado: number;
  lineas_regalo: number;
  monto_regalo: number;
  unds_regalo: number;
}

export interface TicketAnatomy {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  delta_pct: {
    ventas: number | null;
    tickets: number | null;
    unds: number | null;
    unds_per_ticket: number | null;
    monto_per_und: number | null;
    ticket_promedio: number | null;
    margen_pp: number | null;  // diferencia en puntos porcentuales (no %)
  };
  decomposition_log_pct: {
    tickets: number | null;
    unds_per_ticket: number | null;
    monto_per_und: number | null;
    total: number | null;
  };
  compare: "previous_period" | "previous_week" | "previous_year";
  days: number;
}

export interface SalesByDepartment {
  departamento: string;
  ventas: number;
  tickets: number;
  ticket_promedio_linea: number | null;
}

export interface SalesByCategory {
  departamento: string;
  categoria: string;
  ventas: number;
  tickets: number;
}

export interface SalesByOffice {
  sucursal: string;
  ventas: number;
  tickets: number;
}

export interface TopProduct {
  bsale_product_id: number;
  producto: string;
  ventas: number;
  unidades: number;
}

// ---- Simulador de cascada (debugger por SKU) ----
export interface SkuHistoryPoint {
  fecha: string;
  unds_vendidas: number;
  monto: number;
  unds_recibidas: number;
}

export interface SkuHistory {
  sku: string;
  days: number;
  office_id: number | null;
  points: SkuHistoryPoint[];
}

/** Fila de "venta acumulada vs meta" (global o por sucursal). */
export interface GoalRow {
  office_id: number | null;
  sucursal: string;
  venta_acumulada: number;
  meta: number | null;
  meta_prorrateada: number | null;
  avance_pct: number | null;
  cumplimiento_vs_ritmo_pct: number | null;
  proyeccion_cierre_mes: number | null;
}

export interface SalesVsGoal {
  month: string;
  meta_source: string;
  dias_transcurridos: number;
  dias_del_mes: number;
  mes_en_curso: boolean;
  global: GoalRow;
  por_sucursal: GoalRow[];
}

export interface DailySalesProduct {
  bsale_variant_id: number;
  sku: string;
  producto: string;
  departamento: string;
  categoria: string;
  unidades_vendidas: number;
  total_ventas: number;
  stock_actual: number;
  en_quiebre: boolean;
}

export interface DailySalesOffice {
  bsale_office_id: number;
  sucursal: string;
  ventas: number;
  tickets: number;
}

export interface DailySalesDetail {
  date: string;
  summary: {
    ventas: number;
    tickets: number;
    ticket_promedio: number;
  };
  productos: DailySalesProduct[];
  quiebres: DailySalesProduct[];
  por_sucursal: DailySalesOffice[];
}

// ---- Stock ----
export interface StockValuationOffice {
  bsale_office_id: number;
  sucursal: string;
  valor_soles: number;
  unidades: number;
}

export interface StockValuation {
  total_soles: number;
  por_sucursal: StockValuationOffice[];
}

// ---- Taxonomía ----
export interface Subcategory {
  id: number;
  name: string;
  slug: string | null;
  category_id: number;
  category_name?: string;
  department_name?: string;
}

export interface TreeSubcat {
  id: number;
  nombre: string;
  productos: number;
}
export interface TreeCat {
  id: number;
  subcategorias: TreeSubcat[];
}
export interface TreeDep {
  id: number;
  categorias: Record<string, TreeCat>;
}
export interface TaxonomyTree {
  arbol: Record<string, TreeDep>;
}

// ---- Product Types (BSale admin) ----
export interface ProductType {
  bsale_product_type_id: number;
  name: string;
  is_active: boolean;
  is_mapped: boolean;
  subcategory_id: number | null;
  synced_at: string | null;
  subcategory: string | null;
  category: string | null;
  category_id: number | null;
  department: string | null;
  department_id: number | null;
  productos: number;
  productos_activos?: number;
  productos_inactivos?: number;
  expected_name?: string | null;
  naming_ok: boolean;
}

export interface ProductTypesResponse {
  total: number;
  items: ProductType[];
}

export interface ProductTypesWorkspaceSummary {
  total_product_types: number;
  active_product_types: number;
  inactive_product_types: number;
  mapped_count: number;
  unmapped_with_products_count: number;
  unmapped_empty_count: number;
  mapped_empty_count: number;
  naming_mismatches_count: number;
  products_with_override_count: number;
  products_without_classification_count: number;
}

export interface ProductTypesWorkspaceResponse {
  summary: ProductTypesWorkspaceSummary;
  unmapped_with_products: ProductType[];
  unmapped_empty: ProductType[];
  mapped: ProductType[];
}

export interface PullProductTypesResponse {
  ok: boolean;
  operation: string;
  timestamp: string;
  stats: {
    fetched_from_bsale: number;
    new_inserted: number;
    updated: number;
    auto_mapped: number;
    deactivated_locally: number;
    unmapped_with_products: number;
    unmapped_empty: number;
  };
  workspace: ProductTypesWorkspaceResponse;
}

export interface BulkMapProductTypesPayload {
  product_type_ids: number[];
  subcategory_id?: number | null;
  unmap?: boolean;
  rename_in_bsale?: boolean;
  dry_run?: boolean;
}

export interface BulkMapProductTypesResponse {
  ok: boolean;
  operation: string;
  dry_run: boolean;
  timestamp: string;
  target_subcategory: {
    subcategory_id: number;
    subcategory: string;
    category_id: number;
    category: string;
    department_id: number;
    department: string;
  } | null;
  totals: {
    received: number;
    updated?: number;
    to_update?: number;
    renamed_in_bsale?: number;
    rename_failed?: number;
    not_found: number;
  };
  to_update?: Array<{
    bsale_product_type_id: number;
    current_name: string;
    new_name: string;
    old_subcategory_id: number | null;
    new_subcategory_id: number | null;
  }>;
  updated_ids?: number[];
  rename_failed?: Array<{
    bsale_product_type_id: number;
    current_name: string;
    target_name: string;
    error: string;
  }>;
  not_found: number[];
}

export interface BulkDeleteProductTypesPayload {
  product_type_ids?: number[] | null;
  delete_all_empty_unmapped?: boolean;
  dry_run?: boolean;
}

export interface BulkDeleteProductTypesResponse {
  ok: boolean;
  operation: string;
  dry_run: boolean;
  timestamp: string;
  totals: {
    requested: number;
    deleted?: number;
    to_delete?: number;
    blocked_with_products: number;
    failed?: number;
    not_found: number;
  };
  to_delete?: Array<ProductType>;
  deleted?: Array<{ bsale_product_type_id: number; name: string }>;
  blocked_with_products: Array<{
    bsale_product_type_id: number;
    name: string;
    productos: number;
    productos_activos: number;
    productos_inactivos: number;
    reason: string;
  }>;
  failed?: Array<{ bsale_product_type_id: number; name: string; error: string }>;
  not_found: number[];
}

export interface MergeProductTypesPayload {
  source_product_type_ids: number[];
  target_product_type_id: number;
  delete_sources_after?: boolean;
  copy_mapping_if_target_unmapped?: boolean;
  clear_product_overrides?: boolean;
  dry_run?: boolean;
}

export interface MergeProductTypesResponse {
  ok: boolean;
  operation: string;
  dry_run: boolean;
  timestamp: string;
  target?: ProductType;
  sources?: ProductType[];
  sources_not_found?: number[];
  totals: {
    sources_count?: number;
    sources_requested?: number;
    products_to_move?: number;
    products_found?: number;
    active_products_to_move?: number;
    inactive_products_to_move?: number;
    will_delete_sources?: boolean;
    products_moved?: number;
    products_failed?: number;
    sources_deleted?: number;
    sources_kept?: number;
  };
  sample_products?: Array<{
    bsale_product_id: number;
    name: string;
    is_active: boolean;
    bsale_product_type_id: number;
    subcategory_id: number | null;
  }>;
  moved_products?: Array<{
    bsale_product_id: number;
    name: string;
    from_product_type_id: number;
    to_product_type_id: number;
  }>;
  failed_products?: Array<{
    bsale_product_id: number;
    name: string;
    from_product_type_id: number;
    error: string;
  }>;
  sources_deleted?: Array<{ bsale_product_type_id: number; name: string }>;
  sources_kept?: Array<{ bsale_product_type_id: number; name: string; reason: string }>;
}

export interface BulkChangeProductTypePayload {
  target_product_type_id: number;
  product_ids?: number[] | null;
  variant_ids?: number[] | null;
  skus?: string[] | null;
  clear_overrides?: boolean;
  dry_run?: boolean;
}

export interface BulkChangeProductTypeResponse {
  ok: boolean;
  operation: string;
  dry_run: boolean;
  timestamp: string;
  target_product_type: ProductType;
  totals: {
    matched_products: number;
    to_move?: number;
    moved?: number;
    failed?: number;
    already_in_target: number;
    overrides_cleared_on_existing?: number;
    not_found_count: number;
  };
  to_move?: Array<{
    bsale_product_id: number;
    product_name: string;
    is_active: boolean;
    bsale_product_type_id: number;
    override_subcategory_id: number | null;
    current_product_type_name: string | null;
    current_department: string | null;
    current_category: string | null;
    current_subcategory: string | null;
  }>;
  moved?: Array<{
    bsale_product_id: number;
    product_name: string;
    old_product_type_id: number;
    old_product_type_name: string | null;
    new_product_type_id: number;
    new_product_type_name: string;
  }>;
  failed?: Array<{
    bsale_product_id: number;
    product_name: string;
    old_product_type_id: number;
    error: string;
  }>;
  already_in_target: Array<any>;
  not_found: {
    product_ids: number[];
    variant_ids: number[];
    skus: string[];
  };
}

export interface BulkProductSubcategoryPayload {
  subcategory_id: number | null;
  product_ids?: number[] | null;
  variant_ids?: number[] | null;
  skus?: string[] | null;
  clear_all_company_overrides?: boolean;
}

export interface BulkProductSubcategoryResponse {
  ok: boolean;
  operation: string;
  subcategory_id: number | null;
  updated_count: number;
  updated_product_ids: number[];
  not_found: {
    product_ids: number[];
    variant_ids: number[];
    skus: string[];
  };
}

// ---- Auditorías ----
export interface AuditSummary {
  naming_mismatches: number;
  orphan_product_types_with_products: number;
  inactive_but_mapped: number;
  subcategories_without_product_type: number;
  categories_without_subcategories: number;
  departments_without_categories: number;
  duplicate_product_type_names: number;
  products_without_classification: number;
}

/** Origen del problema dentro del sistema completo (BSale ↔ KAWII). */
export type IssueSource = "bsale" | "local_db" | "both";

/** Metadata por tipo de issue: dónde nace, qué significa, cómo se arregla. */
export interface IssueMeta {
  source: IssueSource;
  where: string;
  what: string;
  impact: string;
  fix_hint: string;
  fix_link: string | null;
  row_label: string;
}

export interface AuditResponse {
  ok: boolean;
  generated_at: string;
  severity: "ok" | "warning" | "critical";
  summary: AuditSummary;
  /** Conteo agregado por LADO del sistema con problemas. */
  side_counts?: { bsale: number; local_db: number; both: number };
  /** Metadata por tipo de issue (origen, descripción, fix). */
  meta?: Record<string, IssueMeta>;
  issues: Record<string, Array<Record<string, unknown>>>;
}

export interface FixNamingResponse {
  ok: boolean;
  operation: string;
  dry_run: boolean;
  timestamp: string;
  totals: { candidates: number; fixed: number; failed: number; skipped: number };
  fixed: Array<Record<string, unknown>>;
  failed: Array<Record<string, unknown>>;
  skipped: Array<Record<string, unknown>>;
  scope: string;
}

// ---- Sync ----
export interface SyncTask {
  task_id: string;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | string;
  params?: Record<string, unknown>;
  created_at?: string;
  started_at?: string;
  finished_at?: string;
  returncode?: number;
  error?: string;
  report_path?: string | null;
}

export interface SyncTriggerResponse {
  ok: boolean;
  message: string;
  task_id: string;
}

export interface SyncLogEntry {
  id: number;
  entity: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  records_fetched: number | null;
  records_inserted: number | null;
  records_updated: number | null;
  records_skipped: number | null;
  error_message: string | null;
  duracion_s: number | null;
}

export interface DataQualityIssue {
  id: number;
  entity: string;
  bsale_id: number | null;
  field: string | null;
  issue_type: string;
  description: string | null;
  created_at: string;
}

// ---- Matrices KAWII ----
export interface MatrixResponse {
  module: string;
  total: number;
  limit: number | null;
  offset: number;
  columns: string[];
  rows: Array<Record<string, unknown>>;
}

// ---- Selección jerárquica (árbol Departamento → Categoría → Subcategoría) ----
// Compartida por /compras-catalogo, /ventas-jerarquicas (paneles) y /centro-catalogo.
export type Selection = {
  dept: string | null;
  cat: string | null;
  subcat: string | null;
};

export const ROOT_SELECTION: Selection = { dept: null, cat: null, subcat: null };

// ---- Compras & Catálogo (Dashboard de Compras Inteligente) ----
// Endpoint: GET /analytics/compras-catalogo?office_id=<id>
// Mismo universo de SKUs que el Excel `/analytics/compras-catalogo/excel`:
// matriz 04b filtrada a severidades 🔴 Crítico y 🟠 Alta (quiebres reales).
// Enriquecido con margen (variant_costs) y cantidad sugerida a ordenar.
export interface ComprasCatalogoKpis {
  skus_criticos_total: number;
  skus_critico: number;       // severidad 🔴 Crítico
  skus_alta: number;          // severidad 🟠 Alta
  venta_90d_en_riesgo: number;
  unidades_a_reponer: number;
  margen_promedio_pct: number | null;
  skus_con_similar: number;   // SKUs con ≥1 producto similar con stock en tienda
}

// Producto de nombre parecido (misma subcategoría y sucursal) que YA tiene
// stock en tienda. Advertencia informativa: el SKU no se excluye de compras.
export interface ComprasSimilarItem {
  sku: string;
  producto: string;
  estado: "vigilar" | "lentos" | "liquidar";
  stock: number;
  cobertura: string;
  unds_vend_90d: number;
  sucursal?: string | null;
}

export interface ComprasSimilares {
  vigilar: number;            // similares en estado saludable
  lentos: number;
  liquidar: number;
  items: ComprasSimilarItem[]; // ordenados: vigilar → lentos → liquidar, stock desc
}

export interface ComprasCatalogoDept {
  departamento: string;
  skus_total: number;
  skus_critico: number;
  skus_alta: number;
  venta_soles: number;
  unidades_reponer: number;
  participacion_pct: number;
}

export interface ComprasCatalogoAccion {
  accion: string;             // "REPONER YA", "COMPRAR YA", "PROMOCIONAR", …
  skus: number;
}

export interface ComprasCatalogoSku {
  sku: string;
  producto: string;
  sucursal: string;
  departamento: string | null;
  categoria: string | null;
  subcategoria: string | null;
  clasificacion: string;      // texto completo de la cascada (con emoji)
  severidad: string;          // "🔴 Crítico" | "🟠 Alta"
  accion: string;             // bucket accionable
  causal: string;             // resumen del "por qué" en una palabra
  stock_disponible: number;
  stock_almacen: number;
  velocidad_30d: number;
  velocidad_90d: number;
  unds_vend_90d: number;
  vendido_sku_soles: number;
  cobertura_dias: string | number | null;
  dias_sin_vender: string | number | null;
  proyeccion_30d: number;
  ultima_venta: string | null;
  tendencia: string | null;
  cantidad_sugerida: number;
  similares: ComprasSimilares | null;  // null = sin similares con stock
  margen_pct: number | null;
  margen_soles: number | null;
  costo_soles: number | null;
  margen_origen?: "venta" | "catalogo" | null;  // "catalogo" = precio de lista − costo (sin ventas 90d)
}

export interface ComprasCatalogoResponse {
  generado_at: string;
  office_id: number | null;
  sucursal: string | null;
  cobertura_objetivo_dias: number;
  kpis: ComprasCatalogoKpis;
  por_departamento: ComprasCatalogoDept[];
  por_accion: ComprasCatalogoAccion[];
  skus: ComprasCatalogoSku[];
}

// ---- Rotación Histórica (Ventana arbitraria, ej. "Año 2024") ----
// Endpoint: GET /analytics/rotacion-historica?from&to&office_id
// SQL: 04h_rotacion_historica.sql (variante PARAMETRIZABLE del 04b).
// La clasificación NO usa la cascada de 38 reglas (depende del presente);
// usa Pareto ABC + frecuencia + tendencia intra-ventana.
export interface RotacionHistoricaMeta {
  from: string;          // YYYY-MM-DD
  to: string;            // YYYY-MM-DD
  dias_ventana: number;
  office_id: number | null;
  sucursal: string | null;
  generado_at: string;
}

export interface RotacionHistoricaKpis {
  skus_con_venta: number;
  unds_vendidas: number;
  venta_soles: number;
  skus_pareto_a: number;
  skus_pareto_b: number;
  skus_pareto_c: number;
}

export interface RotacionHistoricaDept {
  departamento: string;
  skus_total: number;
  skus_pareto_a: number;
  venta_soles: number;
  unds_vendidas: number;
  participacion_pct: number;
}

export interface RotacionHistoricaPareto {
  pareto: "A" | "B" | "C";
  skus: number;
  etiqueta: string;
}

export interface RotacionHistoricaClasif {
  clasificacion: string;
  skus: number;
}

export interface RotacionHistoricaSku {
  sku: string;
  producto: string;
  sucursal: string;
  departamento: string | null;
  categoria: string | null;
  subcategoria: string | null;
  unds_vendidas: number;
  vendido_sku_soles: number;
  vendido_subcat_soles: number;
  vendido_cat_soles: number;
  vendido_depto_soles: number;
  pct_en_subcat: number;
  pct_en_cat: number;
  pct_en_depto: number;
  velocidad_uds_dia: number;
  dias_con_venta: number;
  pct_frecuencia: number;
  tendencia: string | null;
  unds_primera_mitad: number;
  unds_segunda_mitad: number;
  rank_sucursal: number;
  pct_acum: number;
  pareto: "A" | "B" | "C";
  clasificacion: string;
  primera_venta: string | null;
  ultima_venta: string | null;
}

export interface RotacionHistoricaResponse {
  meta: RotacionHistoricaMeta;
  kpis: RotacionHistoricaKpis;
  por_departamento: RotacionHistoricaDept[];
  por_pareto: RotacionHistoricaPareto[];
  por_clasificacion: RotacionHistoricaClasif[];
  skus: RotacionHistoricaSku[];
}
