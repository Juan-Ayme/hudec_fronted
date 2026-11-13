// Cliente de los informes gerenciales (`/informes/*` del backend).
//
// Un solo cálculo, tres salidas: JSON (esta pantalla), HTML A4 con gráficos
// (PDF para el jefe, vía "Imprimir → Guardar como PDF") y Excel (analista).
// Ganancia = venta con IGV − costo; métrica principal: MARKUP (ganancia/costo).

import { API_BASE_URL, ApiError, readActiveCompanyId, request } from "./api";

export interface TemporadaItem {
  clave: string;
  nombre: string;
  inicio: string;
  fin: string;
  vigente: boolean;
  dias_para_inicio: number;
}

export type Riesgo = "agotado" | "alto" | "medio" | "temporada" | "bajo" | "sin_venta" | "recompra";

export interface SkuTemporada {
  departamento: string;
  categoria: string;
  subcategoria: string;
  sku: string;
  producto: string;
  precio: number;
  costo: number;
  ganancia_unidad: number;
  markup_pct: number | null;
  stock_total: number;
  stock_almacen: number;
  riesgo: Riesgo;
  quiebre_probable: string | null;
  quiebre_optimista: string | null;
  quiebre_pesimista: string | null;
  dias_quiebre_probable: number | null;
  compra_probable: number;
  compra_probable_soles: number;
  compra_pesimista: number;
  trasladar_desde_almacen: number;
  ganancia_en_riesgo_dia: number;
  unds_temporada_pasada: number;
  venta_temporada_pasada: number;
  dias_agotado_ly: number | null;
  venta_perdida_ly: number;
}

export interface SubcatTemporada {
  departamento: string;
  categoria: string;
  subcategoria: string;
  skus: number;
  compra_probable_soles: number;
  compra_pesimista_soles: number;
  stock_soles: number;
  ganancia_esperada: number;
  skus_riesgo_alto: number;
  markup_temporada_pasada_pct: number | null;
}

export interface InformeTemporada {
  meta: {
    generado_at: string;
    empresa: string | null;
    sucursal?: string | null;
    temporada: {
      clave: string;
      nombre: string;
      inicio: string;
      fin: string;
      dias_restantes: number;
      en_curso: boolean;
    };
    tiendas_comparables: number[];
    tiendas_nuevas: number[];
    supuestos: Record<string, string | number>;
    alertas: string[];
  };
  kpis: {
    venta?: number;
    ganancia?: number;
    markup_pct?: number | null;
    delta_vs_ano_pasado_pct?: number | null;
    dias_comparados?: number;
    presupuesto_compra_probable: number;
    presupuesto_compra_pesimista: number;
    presupuesto_recompra_temporada_pasada: number;
    skus_candidatos_recompra: number;
    skus_agotados: number;
    skus_riesgo_alto: number;
    skus_riesgo_medio: number;
    ganancia_en_riesgo_dia: number;
    venta_perdida_temporada_pasada: number;
    riesgo_conteo?: Record<string, number>;
  };
  resumen: string[];
  subcategorias: SubcatTemporada[];
  skus_riesgo: SkuTemporada[];
  por_agotarse?: SkuTemporada[];
  autopsia_ly: SkuTemporada[];
  recomprar: SkuTemporada[];
}

export const informesQueryKeys = {
  temporadas: () => ["informes", "temporadas"] as const,
  temporada: (clave: string, officeId: number | null) => ["informes", "temporada", clave, officeId] as const,
  periodos: () => ["informes", "periodos"] as const,
  periodo: (desde: string, hasta: string, officeId: number | null) =>
    ["informes", "periodo", desde, hasta, officeId] as const,
};

export const getTemporadas = (signal?: AbortSignal) =>
  request<TemporadaItem[]>("/informes/temporadas", { signal });

/** `?office_id=` de la sucursal elegida en el selector global (vacío = todas). */
const qsOffice = (officeId: number | null | undefined) => (officeId != null ? `?office_id=${officeId}` : "");

export const getInformeTemporada = (clave: string, officeId: number | null, signal?: AbortSignal) =>
  request<InformeTemporada>(`/informes/temporada/${encodeURIComponent(clave)}${qsOffice(officeId)}`, { signal });

export const informeTemporadaExcelUrl = (clave: string, officeId: number | null) =>
  `${API_BASE_URL}/informes/temporada/${encodeURIComponent(clave)}/excel${qsOffice(officeId)}`;

/** Abre el informe del jefe (HTML A4 con gráficos) en una pestaña nueva y lanza
 *  "Imprimir" para guardarlo como PDF. Se baja con fetch (no con un link) porque
 *  el backend exige el header X-Company-Id, que un <a href> no manda.
 *  `path` = ruta del endpoint HTML, p.ej. `/informes/temporada/navidad/html`. */
export async function abrirInformePdf(path: string): Promise<void> {
  // La pestaña se abre ANTES del await para que el navegador no la bloquee
  // como popup (tiene que salir del click del usuario).
  const win = window.open("", "_blank");
  const headers: Record<string, string> = {};
  const companyId = readActiveCompanyId();
  if (companyId !== null) headers["X-Company-Id"] = String(companyId);
  const res = await fetch(`${API_BASE_URL}${path}`, { credentials: "include", headers });
  if (!res.ok) {
    win?.close();
    throw new ApiError(res.status, `No se pudo generar el informe (error ${res.status}).`);
  }
  const html = await res.text();
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  if (win) {
    win.location.href = url;
    win.addEventListener("load", () => setTimeout(() => win.print(), 300), { once: true });
  } else {
    window.location.href = url; // popup bloqueado: abrir en la misma pestaña
  }
}

export const abrirInformeTemporadaPdf = (clave: string, officeId: number | null) =>
  abrirInformePdf(`/informes/temporada/${encodeURIComponent(clave)}/html${qsOffice(officeId)}`);

// ── Informe por PERIODO (cualquier rango de fechas) ────────────────────────

export interface PeriodoItem {
  clave: string;
  nombre: string;
  desde: string;
  hasta: string;
  motivo?: string;
}

export interface PeriodosDisponibles {
  /** Lo que el sistema recomienda mirar hoy (lunes → semana; días 1-5 → cierre de mes). */
  sugerido: PeriodoItem;
  atajos: PeriodoItem[];
  meses: PeriodoItem[];
}

export type Tendencia = "acelera" | "frena" | "estable" | "nueva";

export interface CategoriaPeriodo {
  departamento: string;
  categoria: string;
  subcategoria?: string;
  venta: number;
  ganancia: number;
  markup_pct: number | null;
  participacion_ganancia_pct: number;
  tickets: number;
  participacion_tickets_pct: number;
  ganancia_vs_ano_pasado_pct: number | null;
  ganancia_vs_periodo_anterior_pct: number | null;
  cambio_ganancia_soles: number;
  tendencia: Tendencia;
}

export interface ProductoComprarMas {
  sku: string;
  producto: string;
  categoria: string;
  subcategoria: string;
  unidades: number;
  ganancia: number;
  markup_pct: number | null;
  unidades_vs_periodo_anterior_pct: number | null;
  stock: number;
  stock_almacen: number;
  velocidad_dia: number;
  cobertura_dias: number;
  sugerido_30d: number;
}

export interface InformePeriodo {
  meta: {
    generado_at: string;
    empresa: string | null;
    sucursal: string | null;
    periodo: {
      nombre: string;
      desde: string;
      hasta: string;
      dias: number;
      anterior_desde: string;
      anterior_hasta: string;
      ano_pasado_desde: string;
      ano_pasado_hasta: string;
    };
    tiendas_comparables_ano_pasado: number[];
    alertas: string[];
  };
  kpis: {
    venta: number;
    ganancia: number;
    markup_pct: number | null;
    tickets: number;
    ticket_promedio: number;
    ganancia_vs_ano_pasado_pct: number | null;
    tickets_vs_ano_pasado_pct: number | null;
    markup_ano_pasado_pct: number | null;
    ganancia_vs_periodo_anterior_pct: number | null;
    markup_periodo_anterior_pct: number | null;
  };
  resumen: string[];
  serie: { fecha: string; venta: number; ganancia: number; venta_mismas_tiendas: number | null; venta_ano_pasado: number | null }[];
  categorias: CategoriaPeriodo[];
  trafico: CategoriaPeriodo[];
  acelera: CategoriaPeriodo[];
  frena: CategoriaPeriodo[];
  comprar_mas: ProductoComprarMas[];
  top_productos: { sku: string; producto: string; categoria: string; unidades: number; ganancia: number; markup_pct: number | null }[];
}

export interface ParamsPeriodo {
  desde: string;
  hasta: string;
  nombre?: string;
  /** Sucursal elegida en el selector global (null = todas las tiendas). */
  officeId?: number | null;
}

const qsPeriodo = (p: ParamsPeriodo) =>
  new URLSearchParams({
    desde: p.desde,
    hasta: p.hasta,
    ...(p.nombre ? { nombre: p.nombre } : {}),
    ...(p.officeId != null ? { office_id: String(p.officeId) } : {}),
  }).toString();

export const getPeriodos = (signal?: AbortSignal) =>
  request<PeriodosDisponibles>("/informes/periodos", { signal });

export const getInformePeriodo = (p: ParamsPeriodo, signal?: AbortSignal) =>
  request<InformePeriodo>(`/informes/periodo?${qsPeriodo(p)}`, { signal });

export const informePeriodoExcelUrl = (p: ParamsPeriodo) =>
  `${API_BASE_URL}/informes/periodo/excel?${qsPeriodo(p)}`;

export const abrirInformePeriodoPdf = (p: ParamsPeriodo) =>
  abrirInformePdf(`/informes/periodo/html?${qsPeriodo(p)}`);

/** Análisis ilustrado (portada, tarjetas, decisiones de la semana): periodo +
 *  temporada en curso o próxima. Se abre listo para "Imprimir → PDF". */
export const abrirAnalisisIlustrado = (p: ParamsPeriodo) =>
  abrirInformePdf(`/informes/analisis/html?${qsPeriodo(p)}`);

/** Descarga el JSON del informe (para maquetarlo o archivarlo). */
export function descargarJson(data: unknown, filename: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Informe de SURTIDO (modo hoy o periodo + año pasado) ───────────────────

export type EstadoLote = "estrella" | "normal" | "lento" | "estancado" | "recien" | "agotado";

export interface SkuSurtido {
  sku: string;
  producto: string;
  nombre: string;
  categoria: string;
  subcategoria: string;
  banda: string;
  precio: number;
  abc_ganancia: string;
  abc_unidades: string;
  estado_vida: EstadoLote;
  unidades: number;
  ganancia: number;
  markup_pct: number | null;
  stock: number;
  stock_almacen: number;
  sell_through_pct: number | null;
  venta_dia: number;
  cobertura_dias: number | null;
  vida_proyectada_dias: number | null;
  vida_mediana_ref: number | null;
  capital_congelado: number;
  lucro_cesante_dia: number;
  pedir_30d: number;
  /** Parte de pedir_30d que se cubre trasladando del almacén. */
  trasladar?: number;
  /** Lo que de verdad hay que comprar: pedir_30d − trasladar. */
  comprar_30d?: number;
}

export interface MatrizSurtido {
  categoria: string;
  subcategoria: string;
  banda: string;
  skus: number;
  venta: number;
  ganancia: number;
  markup_pct: number | null;
  sell_through_pct: number | null;
  vida_mediana_dias: number | null;
  gmroi: number | null;
  capital: number;
  capital_congelado: number;
  motivo?: string;
  ganancia_ano_pasado?: number | null;
  ganancia_vs_ano_pasado_pct?: number | null;
}

export interface CostoSubio {
  sku: string;
  nombre: string;
  unidades: number;
  costo_min: number;
  costo_actual: number;
  markup_costo_min_pct: number | null;
  markup_actual_pct: number | null;
  ganancia_perdida: number;
}

export interface InformeSurtido {
  meta: {
    modo: "hoy" | "periodo";
    generado_at: string;
    empresa: string | null;
    sucursal: string | null;
    ventana: { desde: string; hasta: string; dias: number };
    lead_time_dias: number;
    criterios: Record<string, string>;
    alertas: string[];
  };
  kpis: {
    skus: number;
    venta: number;
    ganancia: number;
    markup_pct: number | null;
    gmroi: number | null;
    capital: number;
    capital_congelado: number;
    lotes: Record<EstadoLote, number>;
    por_banda: Record<string, number>;
    urgencia_compra: number;
    liquidar: number;
    ajuste_surtido: number;
    costo_subio: number;
    lucro_cesante_dia: number;
    capital_a_liquidar: number;
    ganancia_perdida_costo: number;
  };
  resumen: string[];
  matriz: MatrizSurtido[];
  urgencia_compra: SkuSurtido[];
  liquidar: SkuSurtido[];
  ajuste_surtido: MatrizSurtido[];
  costo_subio: CostoSubio[];
  comparacion_ano_pasado: null | {
    tiendas: number[];
    desde: string;
    hasta: string;
    kpis: {
      actual: { ganancia: number; markup_pct: number | null; gmroi: number | null };
      ano_pasado: { ganancia: number; markup_pct: number | null; gmroi: number | null };
      ganancia_vs_ano_pasado_pct: number | null;
    };
    matriz: MatrizSurtido[];
  };
}

export interface ParamsSurtido {
  desde?: string;
  hasta?: string;
  officeId?: number | null;
}

const qsSurtido = (p: ParamsSurtido) =>
  new URLSearchParams({
    ...(p.desde && p.hasta ? { desde: p.desde, hasta: p.hasta } : {}),
    ...(p.officeId != null ? { office_id: String(p.officeId) } : {}),
  }).toString();

export const surtidoQueryKey = (p: ParamsSurtido) =>
  ["informes", "surtido", p.desde ?? "hoy", p.hasta ?? "", p.officeId ?? null] as const;

export const getInformeSurtido = (p: ParamsSurtido, signal?: AbortSignal) =>
  request<InformeSurtido>(`/informes/surtido?${qsSurtido(p)}`, { signal });

export const informeSurtidoExcelUrl = (p: ParamsSurtido) =>
  `${API_BASE_URL}/informes/surtido/excel?${qsSurtido(p)}`;

// ── Informes mensuales para el gerente (PDF ilustrado) ─────────────────────

/** Cierre del mes pasado: movimiento y motivos por categoría, quiebres, rebajas y remates. */
export const abrirCierreMesPdf = (officeId: number | null) =>
  abrirInformePdf(`/informes/cierre-mes/html${officeId != null ? `?office_id=${officeId}` : ""}`);

/** Tiendas que se pueden elegir para "¿Qué compramos esta semana?". */
export interface TiendaCompras {
  id: number;
  nombre: string;
}

export const getTiendasCompras = (signal?: AbortSignal) =>
  request<TiendaCompras[]>("/informes/compras/tiendas", { signal });

/** "¿Qué compramos esta semana?": qué comprar en las tiendas elegidas, dentro del presupuesto. */
export const abrirComprasPdf = (oficinas: number[], presMin: number, presMax: number) => {
  const qs = new URLSearchParams();
  oficinas.forEach((o) => qs.append("oficinas", String(o)));
  qs.set("pres_min", String(presMin));
  qs.set("pres_max", String(presMax));
  return abrirInformePdf(`/informes/compras/html?${qs.toString()}`);
};

/** Excel de traslados entre las tiendas elegidas (regla de 14 días, igual que el informe de compras). */
export const trasladosExcelUrl = (oficinas: number[], presMin: number, presMax: number) => {
  const qs = new URLSearchParams();
  oficinas.forEach((o) => qs.append("oficinas", String(o)));
  qs.set("pres_min", String(presMin));
  qs.set("pres_max", String(presMax));
  return `${API_BASE_URL}/informes/traslados/excel?${qs.toString()}`;
};

/** Mes en curso + compras: avance, categorías que bajan y presupuesto de compra. */
export const abrirMesCursoPdf = (officeId: number | null) =>
  abrirInformePdf(`/informes/mes-curso/html${officeId != null ? `?office_id=${officeId}` : ""}`);

// ── Campaña de juguetes (Navidad): compras y capital por nivel de costo ────

/** PDF de la campaña de juguetes: capital por nivel y qué comprar por categoría y
 *  subcategoría, en dos compras. Usa las tiendas de la empresa que ve el usuario. */
export const abrirCampanaJuguetesPdf = () => abrirInformePdf("/informes/campana-juguetes/html");

/**
 * "¿Cómo funciona cada tienda?": días, horas, departamentos, stock y agotados por tienda.
 * `officeId` null = todas las tiendas comparadas lado a lado; con valor = solo esa tienda,
 * comparada contra el promedio de las otras. `semanas` = semanas completas (lunes a domingo).
 */
export const abrirSucursalesPdf = (officeId: number | null, semanas = 5) => {
  const qs = new URLSearchParams({ semanas: String(semanas) });
  if (officeId != null) qs.set("office_id", String(officeId));
  return abrirInformePdf(`/informes/sucursales/html?${qs}`);
};

/**
 * "¿Cómo vendemos más en la mañana?" (hasta la 1 pm): si falta gente o ticket, primer cliente,
 * mañana más floja, qué se compra temprano y plan por tienda. `officeId` null = todas las
 * tiendas; con valor = solo esa, contra el promedio de las otras.
 */
export const abrirMananasPdf = (officeId: number | null, semanas = 8) => {
  const qs = new URLSearchParams({ semanas: String(semanas) });
  if (officeId != null) qs.set("office_id", String(officeId));
  return abrirInformePdf(`/informes/mananas/html?${qs}`);
};

/** El mismo informe en Excel, con el detalle por producto y por tienda. */
export const campanaJuguetesExcelUrl = () => `${API_BASE_URL}/informes/campana-juguetes/excel`;
