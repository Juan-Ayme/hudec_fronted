// Atributos de producto (capa propia, no BSale): cobertura, plantilla del
// driver de compras y carga del driver en Excel. Ver backend
// app/routers/product_attributes.py.
import {
  API_BASE_URL,
  ApiError,
  downloadExcelFile,
  readActiveCompanyId,
  request,
} from "@/lib/api";

export interface AtributoDef {
  code: string;
  name: string;
  level: "product" | "variant";
  data_type: string;
  allowed_values: string[] | null;
  push_to_bsale: boolean;
}

export interface CoberturaAtributo {
  con_valor: number;
  pct: number;
  /** inferred = adivinado del nombre, driver = Excel, manual = a mano. */
  por_fuente: Record<string, number>;
}

export interface CoberturaAtributos {
  productos: number;
  incluye_inactivos: boolean;
  atributos: Record<string, CoberturaAtributo>;
}

export interface ImportDriverResult {
  ok: boolean;
  dry_run: boolean;
  archivo: string;
  columnas_reconocidas: string[];
  columnas_de_atributos: string[];
  stats: {
    filas: number;
    emparejadas: number;
    proveedores_nuevos: number;
    relaciones_proveedor: number;
    atributos_escritos: number;
    atributos_bloqueados_por_manual: number;
    /** Valores iguales a los que ya estaban: no se reescriben. */
    sin_cambio?: number;
  };
  atributos_por_codigo: Record<string, number>;
  proveedores_nuevos: string[];
  sin_match: {
    fila: number;
    sku: string | null;
    codigo_barra: string | null;
    nombre: string | null;
    motivo: string;
  }[];
  tipo_bsale_distinto: {
    fila: number;
    sku: string | null;
    producto: string;
    tipo_actual: string;
    tipo_driver: string;
  }[];
  advertencias: { fila: number; detalle: string }[];
}

export const getAtributoDefs = (signal?: AbortSignal) =>
  request<{ definitions: AtributoDef[] }>("/attributes/definitions", { signal });

export const getCoberturaAtributos = (signal?: AbortSignal) =>
  request<CoberturaAtributos>("/attributes/coverage", { signal });

/** Plantilla del driver con listas desplegables (taxonomía vigente de la empresa).
 * `conProductos`: una fila por producto activo con sus atributos actuales. */
export const bajarPlantillaDriver = (conProductos = false) =>
  downloadExcelFile(
    `${API_BASE_URL}/attributes/driver-template${conProductos ? "?con_productos=true" : ""}`,
    conProductos ? "atributos_productos.xlsx" : "driver_compras.xlsx",
  );

/** Sube el driver. Con `dryRun` el backend solo informa qué haría, sin guardar. */
export async function subirDriver(file: File, dryRun: boolean): Promise<ImportDriverResult> {
  const headers: Record<string, string> = {};
  const companyId = readActiveCompanyId();
  if (companyId !== null) headers["X-Company-Id"] = String(companyId);
  // Con FormData el navegador pone el Content-Type (boundary del multipart).
  const fd = new FormData();
  fd.append("file", file, file.name);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/attributes/import-driver?dry_run=${dryRun}`, {
      method: "POST",
      headers,
      body: fd,
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, `No se pudo conectar con la API (${API_BASE_URL}).`);
  }
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const j = await res.json();
      detail = j.detail ?? j.error ?? detail;
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(res.status, typeof detail === "string" ? detail : `Error ${res.status}`);
  }
  return res.json();
}
