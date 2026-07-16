// Tipos del módulo BI (Pulso / Diagnóstico / Salud del Catálogo / Plan del Mes).
// Se mantiene separado de types.ts (que hoy tiene 791 líneas de tipos legacy) para
// que las 4 vistas nuevas y sus admin views no crezcan sobre un archivo ya saturado.
// Mismos endpoints en todas las empresas — el multi-tenant viaja en el header
// X-Company-Id que inyecta request() en api.ts.

// ─────────────────────────── Primitives compartidos ───────────────────────────

export type MetaEstado =
  | "META_CUMPLIDA"
  | "ADELANTADO"
  | "EN_RITMO"
  | "ATRASADO_LEVE"
  | "RIESGO_NO_LLEGAR"
  | "SIN_META";

export type VeredictoCodigo =
  | "CRECIENDO_FUERTE"
  | "BAJON_ESTACIONAL_NORMAL"
  | "PROBLEMA_REAL"
  | "ESTANCAMIENTO";

export type AlertaSeveridad = "CRITICA" | "ALTA" | "MEDIA";

export type CoberturaEstado = "OK" | "ADVERTENCIA" | "CRITICA";

export type TendenciaCategoria =
  | "subiendo"
  | "estable"
  | "bajando"
  | "hueco"
  | "nuevo";

export type HuecoDiagnostico =
  | "cambio_de_demanda"
  | "discontinuado_sin_reemplazo"
  | string; // el backend puede devolver otros códigos futuros

export type SkusEstado = "OK" | "FALTAN_SKUS" | "EXCESO_SKUS";

export type MetaSource =
  | "exacta"
  | "prorrateado_yoy"
  | "prorrateado_historico"
  | string;

export interface CoberturaCostos {
  pct_actual: number;
  estado: CoberturaEstado;
  warning: string | null;
}

export interface Exclusiones {
  departamentos: string[];
  categorias: string[];
  nota: string;
}

/** Sub-ventana de comparación del veredicto. El backend manda un dict con
 *  claves como "actual" / "mes_anterior" / "ano_anterior", cada una con su
 *  rango de fechas y ventas. */
export interface VeredictoVentanaPeriodo {
  from?: string;
  to?: string;
  ventas_total?: number;
  ventas_recurrente?: number;
  [k: string]: unknown;
}

export type VeredictoVentana = Record<string, VeredictoVentanaPeriodo | undefined>;

export interface Veredicto {
  codigo: VeredictoCodigo;
  titulo: string;
  explicacion: string;
  delta_yoy_pct?: number;
  delta_mes_anterior_pct?: number;
  base_calculo?: "venta_total" | "venta_recurrente" | string;
  ventana?: VeredictoVentana;
}

/** Meta común a los 4 endpoints (subset que se puede consumir uniformemente). */
export interface MetaBase {
  office_id: number | null;
  office_scope: number[];
  exclusiones: Exclusiones;
  cobertura_costos: CoberturaCostos;
}

// ────────────────────────────── Vista 1 — Pulso ──────────────────────────────

export interface PulseMeta extends MetaBase {
  fecha: string;
  hoy_excluido: boolean;
  ultimo_dia_cerrado: string;
  datos_sync_hasta: string;
  generado_at: string;
}

export interface PulseMesSucursal {
  office_id: number;
  sucursal: string;
  venta_acumulada: number;
  venta_acumulada_recurrente: number;
  meta: number;
  meta_prorrateada: number;
  /** venta − meta: NEGATIVO = falta para la meta. Convención unificada en
   *  todos los endpoints BI (jul 2026). */
  gap_a_meta: number;
  avance_pct: number;
  cumplimiento_vs_ritmo_pct: number;
  proyeccion_cierre_mes: number;
  venta_diaria_necesaria: number;
  estado: MetaEstado;
}

export interface PulseMesEnCurso {
  mes: string; // "YYYY-MM"
  meta_source: MetaSource;
  dias_transcurridos: number;
  dias_del_mes: number;
  dias_restantes: number;
  ultimo_dia_cerrado: string;
  global: PulseMesSucursal;
  por_sucursal: PulseMesSucursal[];
}

export interface PulseUltimoDia {
  fecha: string;
  dia_semana: string;
  ventas: number;
  ventas_recurrente: number;
  tickets: number;
  ticket_promedio: number;
  ventas_promedio_mismo_dow: number;
  delta_vs_promedio_dow_pct: number;
  z_score: number;
  anomalo: boolean;
  n_dias_comparacion: number;
  base_calculo: "venta_total" | "venta_recurrente" | string;
}

export interface PulseSemanaDia {
  fecha: string;
  dia: string; // "Lun", "Mar", …
  ventas: number;
  ventas_recurrente: number;
  tickets: number;
  ticket_promedio: number;
}

export interface PulseUltimos7Dias {
  from: string;
  to: string;
  ventas: number;
  ventas_recurrente: number;
  tickets: number;
  ticket_promedio: number;
  delta_vs_semana_anterior_pct_total: number;
  delta_vs_semana_anterior_pct_recurrente: number;
  delta_vs_ano_anterior_pct_total: number;
  delta_vs_ano_anterior_pct_recurrente: number;
}

export interface PulseAlerta {
  severidad: AlertaSeveridad;
  tipo: string;
  titulo: string;
  detalle: string;
  impacto_pen: number;
  accion_sugerida: string;
  skus?: string[];
}

export interface PulseResponse {
  meta: PulseMeta;
  mes_en_curso: PulseMesEnCurso;
  veredicto: Veredicto;
  ultimo_dia_cerrado: PulseUltimoDia;
  semana_en_curso: PulseSemanaDia[];
  ultimos_7_dias: PulseUltimos7Dias;
  alertas: PulseAlerta[];
}

// ───────────────────────── Vista 2 — Diagnóstico ─────────────────────────

export interface DiagnosisWindow {
  from: string;
  to: string;
  dias: number;
}

export interface DiagnosisWindowShift extends DiagnosisWindow {
  shift_dias: number;
}

export interface DiagnosisWindowBase4w extends DiagnosisWindow {
  normalizado_a_dias: number;
}

export interface DiagnosisMetaAlerta {
  tipo: string;
  mensaje: string;
}

export interface DiagnosisMeta extends MetaBase {
  current: DiagnosisWindow;
  semana: DiagnosisWindowShift;
  base_4w: DiagnosisWindowBase4w;
  yoy: DiagnosisWindow;
  hoy_excluido: boolean;
  datos_sync_hasta: string;
  generado_at: string;
  alertas: DiagnosisMetaAlerta[];
}

export interface DiagnosisKpisActual {
  from: string;
  to: string;
  ventas_total: number;
  ventas_recurrente: number;
  tickets: number;
  unds: number;
  ticket_promedio: number;
  margen_pct_total: number;
  margen_pct_recurrente: number;
  descuento_pct: number;
  /** Detalle interno usado por el backend para debugging. Passthrough — el frontend no lo lee. */
  _detalle_total?: unknown;
  _detalle_recurrente?: unknown;
}

export interface DiagnosisKpisComparativa {
  label: string;
  from: string;
  to: string;
  ventas_total: number;
  ventas_recurrente: number;
  tickets: number;
  delta_abs_total: number;
  delta_pct_total: number;
  delta_abs_recurrente: number;
  delta_pct_recurrente: number;
}

export interface DiagnosisKpis {
  actual: DiagnosisKpisActual;
  vs_semana_anterior: DiagnosisKpisComparativa;
  vs_promedio_4_semanas: DiagnosisKpisComparativa;
  vs_ano_anterior: DiagnosisKpisComparativa;
}

export interface DiagnosisAnatomiaContribucion {
  tickets: number;
  unds_per_ticket: number;
  monto_per_und: number;
  total: number;
}

export interface DiagnosisAnatomia {
  delta_pct_total: number;
  contribucion_log_pct: DiagnosisAnatomiaContribucion;
  comparacion_base: string;
  base_calculo: "venta_total" | "venta_recurrente" | string;
  lectura: string;
}

export interface DiagnosisDescompBase {
  ventas_actual: number;
  ventas_prev: number;
  delta_abs: number;
  delta_pct: number | null;
  share_pct: number;
}

export interface DiagnosisDescompSucursal extends DiagnosisDescompBase {
  office_id: number;
  sucursal: string;
}

export interface DiagnosisDescompCategoria extends DiagnosisDescompBase {
  departamento: string;
  categoria: string;
}

export interface DiagnosisDescompDia extends DiagnosisDescompBase {
  dia: string;
}

export interface DiagnosisDescompFranja extends DiagnosisDescompBase {
  franja: string;
}

export interface DiagnosisDescompVendedor extends DiagnosisDescompBase {
  vendedor: string;
  vendedor_id?: number | string;
}

export interface DiagnosisDescomposicion {
  comparacion_base: string;
  por_sucursal: DiagnosisDescompSucursal[];
  por_categoria: DiagnosisDescompCategoria[];
  por_dia_semana: DiagnosisDescompDia[];
  por_franja_horaria: DiagnosisDescompFranja[];
  por_vendedor: DiagnosisDescompVendedor[];
}

export interface DiagnosisQuiebreSku {
  sku: string;
  producto: string;
  sucursal?: string;
  office_id?: number;
  dias_quiebre: number;
  /** Tasa diaria promedio de venta (unidades/día en los últimos 30d). */
  tdpv: number;
  precio_unit: number;
  perdida_estimada_pen: number;
}

export interface DiagnosisVentaPerdida {
  monto_estimado_pen: number;
  skus_con_perdida: number;
  metodo: string;
  top_skus: DiagnosisQuiebreSku[];
}

export interface DiagnosisCambioDescuentos {
  pct_actual: number;
  pct_prev: number;
  delta_pp: number;
  [k: string]: unknown;
}

export interface DiagnosisDevoluciones {
  monto_actual: number;
  monto_prev: number;
  delta_pct: number | null;
  [k: string]: unknown;
}

export interface DiagnosisGratuidades {
  lineas_actual: number;
  [k: string]: unknown;
}

export interface DiagnosisFactores {
  venta_perdida_por_quiebre: DiagnosisVentaPerdida;
  cambio_descuentos: DiagnosisCambioDescuentos;
  devoluciones: DiagnosisDevoluciones;
  gratuidades: DiagnosisGratuidades;
}

export interface DiagnosisSkuMov {
  sku: string;
  producto: string;
  sucursal?: string;
  office_id?: number;
  ventas_actual: number;
  ventas_prev: number;
  delta_abs: number;
  delta_pct: number | null;
  unds_actual?: number;
  unds_prev?: number;
  [k: string]: unknown;
}

/** SKU nuevo con tracción. Shape distinto al resto de winners/losers: como no
 *  existía en el período previo, el backend NO manda ventas_prev/delta —
 *  manda la venta del período y la fecha de primera venta. */
export interface DiagnosisSkuNuevo {
  sku: string;
  producto: string;
  sucursal?: string;
  office_id?: number;
  ventas: number;
  unds?: number;
  primera_venta?: string;
  [k: string]: unknown;
}

export interface DiagnosisWinnersLosers {
  top_subieron: DiagnosisSkuMov[];
  top_cayeron: DiagnosisSkuMov[];
  skus_nuevos_con_traccion: DiagnosisSkuNuevo[];
  skus_que_se_enfriaron: DiagnosisSkuMov[];
}

export interface HuecoYoy {
  departamento: string;
  categoria: string;
  subcategoria: string;
  venta_actual: number;
  venta_yoy: number;
  hueco_pen: number;
  delta_pct: number;
  diagnostico: HuecoDiagnostico;
}

export interface DiagnosisResponse {
  meta: DiagnosisMeta;
  kpis: DiagnosisKpis;
  veredicto: Veredicto;
  anatomia: DiagnosisAnatomia;
  descomposicion: DiagnosisDescomposicion;
  factores_adicionales: DiagnosisFactores;
  ganadores_y_perdedores: DiagnosisWinnersLosers;
  huecos_yoy: HuecoYoy[];
  resumen: string[];
}

// ─────────────────────── Vista 3 — Salud del Catálogo ───────────────────────

export type TargetRol =
  | "motor_1"
  | "motor_2"
  | "motor_3"
  | "motor_4"
  | "fijo"
  | "complemento"
  | "upsell";

export interface CatalogMeta extends MetaBase {
  fecha: string;
  datos_sync_hasta: string;
  generado_at: string;
  nota: string;
}

export interface Bloque8020Sucursal {
  office_id: number;
  sucursal: string;
  meta_total: number;
  venta_acumulada_total: number;
  meta_prorrateada_total: number;
  avance_pct: number;
  ritmo_vs_meta_pct: number;
  categorias: number;
  cumplen: number;
  en_ritmo: number;
  atrasado_leve: number;
  riesgo: number;
}

export interface Bloque8020Categoria {
  category_id: number;
  categoria: string;
  departamento: string;
  office_id: number;
  sucursal: string;
  rol: TargetRol;
  meta_mensual_pen: number;
  meta_prorrateada: number;
  venta_acumulada_mes: number;
  /** venta − meta: NEGATIVO = falta para la meta. Misma convención que /pulse. */
  gap_a_meta: number;
  avance_pct: number;
  ritmo_vs_meta_pct: number;
  proyeccion_cierre: number;
  estado: MetaEstado;
  skus_con_stock: number;
  skus_min: number;
  skus_max: number;
  skus_estado: SkusEstado;
  pvp_min: number;
  pvp_max: number;
  margen_objetivo_pct: number;
}

export interface Bloque8020 {
  mes: string;
  dias_transcurridos: number;
  dias_del_mes: number;
  ultimo_dia_cerrado: string;
  total_categorias: number;
  por_sucursal: Bloque8020Sucursal[];
  categorias: Bloque8020Categoria[];
}

export interface TopCategoria {
  departamento: string;
  categoria: string;
  ventas_30d: number;
  ventas_30d_yoy: number;
  delta_yoy_pct: number | null;
  skus_con_venta: number;
  tendencia: TendenciaCategoria;
}

export interface TopCategoriasBlock {
  ventana: string;
  from: string;
  to: string;
  total_actual: number;
  total_yoy: number;
  delta_yoy_pct: number | null;
  top_categorias: TopCategoria[];
  categorias_totales: number;
}

export interface HuecoYoyCatalog extends HuecoYoy {
  skus_afectados?: number;
}

export interface HuecosYoyBlock {
  ventana: string;
  criterio: string;
  total_hueco_pen: number;
  subcategorias_count: number;
  top_huecos: HuecoYoyCatalog[];
}

export interface CapitalAtrapadoSku {
  sku: string;
  producto: string;
  sucursal: string;
  office_id: number;
  fecha_recepcion: string;
  unds_recibidas: number;
  unds_vendidas: number;
  stock_actual: number;
  sellthrough_pct: number;
  costo_unit: number;
  capital_atrapado_pen: number;
}

export interface CapitalAtrapado {
  criterio: string;
  ventana_recepcion: string;
  skus_count_total: number;
  monto_total_pen: number;
  top_skus: CapitalAtrapadoSku[];
}

export interface CandidatoDescuentoSku {
  sku: string;
  producto: string;
  departamento?: string;
  categoria?: string;
  sucursal: string;
  office_id: number;
  /** El backend manda `stock` (no `stock_actual`) en este endpoint. */
  stock: number;
  costo_unit: number;
  valor_inventario_pen: number;
}

export interface CandidatosDescuento {
  criterio: string;
  skus_count_total: number;
  valor_inventario_pen: number;
  top_skus: CandidatoDescuentoSku[];
}

export interface QuiebreDemandaSku {
  sku: string;
  producto: string;
  sucursal?: string;
  office_id?: number;
  dias_quiebre: number;
  /** Tasa diaria promedio de venta (unidades/día). */
  tdpv: number;
  precio_unit?: number;
  perdida_estimada_pen: number;
}

export interface QuiebresDemanda {
  skus_count: number;
  monto_estimado_pen: number;
  ventana_dias: number;
  top_skus: QuiebreDemandaSku[];
  ver_detalle_en: string;
}

export type ComposicionBucket = "nuevo" | "reciente" | "clasico" | string;

export interface ComposicionEdad {
  bucket: ComposicionBucket;
  etiqueta: string;
  skus: number;
  venta_pen: number;
  pct_venta: number;
  pct_unds: number;
}

export interface ComposicionCatalogo {
  ventana_venta: string;
  total_venta_pen: number;
  total_skus: number;
  por_edad: ComposicionEdad[];
  lectura: string;
}

export interface CatalogHealthResponse {
  meta: CatalogMeta;
  bloque_estable_80_20: Bloque8020 | null;
  categorias: TopCategoriasBlock;
  huecos_yoy: HuecosYoyBlock;
  capital_atrapado: CapitalAtrapado;
  candidatos_descuento: CandidatosDescuento;
  quiebres_demanda: QuiebresDemanda;
  composicion_catalogo: ComposicionCatalogo;
  resumen: string[];
}

// ───────────────────────── Vista 4 — Plan del Mes ─────────────────────────

export interface PlanMeta extends MetaBase {
  fecha: string;
  mes_actual: string;
  mes_objetivo: string;
  datos_sync_hasta: string;
  generado_at: string;
}

export interface PlanMesEnCurso {
  mes: string;
  dias_transcurridos: number;
  dias_del_mes: number;
  dias_restantes: number;
  ultimo_dia_cerrado: string;
  venta_acumulada: number;
  venta_acumulada_recurrente: number;
  venta_diaria_promedio: number;
  meta: number;
  meta_source: MetaSource;
  /** venta − meta: NEGATIVO = falta. Unificado con /pulse en jul 2026 —
   *  antes este endpoint usaba el signo inverso. */
  gap_a_meta: number | null;
  proyeccion_lineal: number;
  estado: MetaEstado;
  /** null cuando la meta ya se cumplió o no quedan días. */
  venta_diaria_necesaria: number | null;
  ritmo_necesario_multiplo: number | null;
}

export type SugerenciaNivel = "conservadora" | "realista" | "agresiva";

export interface SugerenciaProximoMes {
  mes_objetivo: string;
  metodo: string;
  venta_yoy_mismo_mes: number;
  crecimiento_yoy_3m_pct: number;
  muestras_crecimiento: number;
  mejor_mes_historico: number;
  meta_conservadora: number;
  meta_realista: number;
  meta_agresiva: number;
  recomendacion: SugerenciaNivel;
}

export interface PacingSemana {
  sem: number;
  from: string;
  to: string;
  dias: number;
  pct_mes: number;
  meta: number;
  yoy_venta: number;
}

export interface PacingSemanal {
  mes: string;
  meta_total: number;
  metodo: string;
  venta_yoy_total: number;
  semanas: PacingSemana[];
}

export interface CategoriaProtagonista {
  departamento: string;
  categoria: string;
  venta_yoy: number;
}

export interface CalendarioMes {
  mes: string;
  mes_nombre: string;
  campana_principal: string;
  venta_yoy: number;
  meta_conservadora: number;
  meta_realista: number;
  meta_agresiva: number;
  categoria_protagonista: CategoriaProtagonista | null;
}

export interface PresupuestoDesgloseCategoria {
  category_id: number;
  categoria: string;
  departamento: string;
  office_id: number;
  sucursal: string;
  rol: TargetRol;
  meta_mensual_categoria: number;
  share_del_total_pct: number;
  cuota_meta_venta_pen: number;
  margen_objetivo_pct: number;
  costo_estimado_pen: number;
  presupuesto_compra_pen: number;
}

export interface Presupuesto {
  mes_objetivo: string;
  meta_venta: number;
  margen_promedio_pct: number;
  muestras_margen: number;
  costo_estimado_pen: number;
  presupuesto_compra_pen: number;
  desglose_por_categoria: PresupuestoDesgloseCategoria[];
  nota: string;
}

export interface PlanResponse {
  meta: PlanMeta;
  mes_en_curso: PlanMesEnCurso;
  sugerencia_proximo_mes: SugerenciaProximoMes;
  pacing_semanal: PacingSemanal;
  calendario_campanas: CalendarioMes[];
  presupuesto_compra: Presupuesto;
  resumen: string[];
}

// ─────────────────────── Admin — Category Targets ───────────────────────

export interface CategoryTarget {
  category_id: number;
  categoria: string;
  departamento: string;
  bsale_office_id: number;
  sucursal: string;
  rol: TargetRol;
  meta_mensual_pen: number;
  pvp_min: number;
  pvp_max: number;
  margen_objetivo_pct: number;
  skus_min: number;
  skus_max: number;
  nota: string | null;
}

export interface CategoryTargetsList {
  total: number;
  items: CategoryTarget[];
}

export interface CategoryTargetsPreview {
  total_sugerencias: number;
  exclusiones_aplicadas: Exclusiones;
  criterios: Record<string, unknown>;
  items: CategoryTarget[];
}

export interface CategoryTargetsBootstrapResult {
  ok: true;
  filas_insertadas: number;
  filas_borradas: number;
  force: boolean;
  items: CategoryTarget[];
}

export type CategoryTargetPatch = Partial<
  Pick<
    CategoryTarget,
    | "rol"
    | "meta_mensual_pen"
    | "pvp_min"
    | "pvp_max"
    | "margen_objetivo_pct"
    | "skus_min"
    | "skus_max"
    | "nota"
  >
>;

export interface CategoryTargetUpdateResult {
  ok: true;
  actualizado: CategoryTarget;
}

// ─────────────────────── Admin — Variant Costs ───────────────────────

export interface VariantCostAuditVariantes {
  total_activas: number;
  con_costo: number;
  sin_costo: number;
  recuperables: number;
  irrecuperables: number;
  pct_cobertura: number;
}

export interface VariantCostAuditVentas90d {
  venta_total: number;
  venta_con_costo: number;
  venta_sin_costo: number;
  venta_sin_costo_pct: number;
  venta_recuperable: number;
  venta_recuperable_pct: number;
  cobertura_costos_pct: number;
}

export interface VariantCostAudit {
  variantes: VariantCostAuditVariantes;
  ventas_ultimos_90d: VariantCostAuditVentas90d;
  diagnostico: string;
}

export interface VariantCostBackfillSample {
  variant_id?: number | string;
  sku?: string;
  costo_actual: number | null;
  costo_nuevo: number;
  fuente?: string;
  [k: string]: unknown;
}

export interface VariantCostBackfillResult {
  dry_run: boolean;
  candidatos_total: number;
  actualizados: number;
  saltados_sin_recep: number;
  sample?: VariantCostBackfillSample[];
  nota: string;
}

export interface VariantCostByOfficeParams {
  office_id?: number | null;
  page?: number;
  page_size?: number;
  days?: number;
  umbral_margen_bajo?: number;
  umbral_margen_alto?: number;
  umbral_outlier_pct?: number;
  umbral_desactualizado_pct?: number;
  umbral_ratio_max_min?: number;
  solo_problemas?: boolean;
}

export interface VariantCostHealthDetail {
  sucursal: string;
  codigo_sku: string;
  producto: string;
  costo_efectivo: number;
  costo_origen: string;
  tabla_costo: string;
  precio_venta: number;
  tabla_precio: string;
  margen_soles: number;
  margen_pct: number;
  costo_avg_sucursales: number;
  costo_min_sucursales: number;
  costo_max_sucursales: number;
  diff_vs_avg_pct: number;
  ratio_max_min: number;
  ultimo_costo_recepcion: number | null;
  n_recepciones: number;
  uds_vendidas_periodo: number;
  impacto_soles: number;
  severidad: "ERROR" | "WARNING" | "OK";
  alertas: string[];
}

export interface VariantCostHealthSummary {
  ventana_dias: number;
  variantes_analizadas: number;
  filas_total: number;
  salud: {
    ok: number;
    warning: number;
    error: number;
    pct_ok: number;
  };
  problemas_por_tipo: Record<string, number>;
  impacto_total_soles: number;
}

export interface VariantCostHealthResponse {
  resumen: VariantCostHealthSummary;
  paginacion: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  detalle: VariantCostHealthDetail[];
  nota?: string;
}
