// Mapeos entre códigos del backend BI y los tonos/iconos del UI kit.
// Se centralizan acá para que los 4 dashboards y sus admin views compartan
// exactamente la misma paleta y semántica (verde=cumplido, rojo=riesgo, etc.).

import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Circle,
  Clock,
  Info,
  Minus,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Snowflake,
  Sparkles,
  Sprout,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import type {
  AlertaSeveridad,
  CoberturaEstado,
  ComposicionBucket,
  MetaEstado,
  SkusEstado,
  TargetRol,
  TendenciaCategoria,
  VeredictoCodigo,
} from "@/lib/bi-types";

export interface CodigoMeta {
  tone: BadgeTone;
  label: string;
  icon: LucideIcon;
}

// Estado de meta (mes en curso, categoría, etc.).
export const ESTADO_META: Record<MetaEstado, CodigoMeta> = {
  META_CUMPLIDA:    { tone: "success", label: "Meta cumplida", icon: CheckCircle2 },
  ADELANTADO:       { tone: "info",    label: "Adelantado",    icon: TrendingUp   },
  EN_RITMO:         { tone: "success", label: "En ritmo",      icon: Activity     },
  ATRASADO_LEVE:    { tone: "warning", label: "Atrasado leve", icon: Clock        },
  RIESGO_NO_LLEGAR: { tone: "danger",  label: "Riesgo",        icon: AlertTriangle },
  SIN_META:         { tone: "neutral", label: "Sin meta",      icon: Circle       },
};

// Explicación en lenguaje de gerente de cada estado. Se muestra como tooltip
// del EstadoBadge — el estado compara la venta acumulada contra la parte de
// la meta que corresponde al día del mes (meta prorrateada).
export const ESTADO_META_DESC: Record<MetaEstado, string> = {
  META_CUMPLIDA:    "Ya se superó la meta del mes completo.",
  ADELANTADO:       "La venta va por encima de lo esperado para el día del mes.",
  EN_RITMO:         "La venta va al ritmo esperado para el día del mes.",
  ATRASADO_LEVE:    "La venta va levemente por debajo de lo esperado a la fecha. Aún es recuperable.",
  RIESGO_NO_LLEGAR: "La venta va muy por debajo de lo esperado a la fecha. A este ritmo no se llega a la meta.",
  SIN_META:         "No hay meta cargada para este mes. Cargala en Configuración → Metas.",
};

/** Tono de gauge/medidor según el estado de meta del backend. Evita colorear
 *  el "% de avance del mes" con umbrales fijos (a inicio de mes un avance
 *  bajo es normal — lo que importa es el ritmo, y eso ya lo resume `estado`). */
export function estadoGaugeTone(
  estado: MetaEstado,
): "primary" | "success" | "warning" | "danger" {
  switch (estado) {
    case "META_CUMPLIDA":
    case "ADELANTADO":
    case "EN_RITMO":
      return "success";
    case "ATRASADO_LEVE":
      return "warning";
    case "RIESGO_NO_LLEGAR":
      return "danger";
    default:
      return "primary";
  }
}

// Veredictos del momento del negocio.
export const VEREDICTO: Record<VeredictoCodigo, CodigoMeta> = {
  CRECIENDO_FUERTE:        { tone: "success", label: "Creciendo fuerte",       icon: TrendingUp   },
  BAJON_ESTACIONAL_NORMAL: { tone: "info",    label: "Bajón estacional",       icon: Snowflake    },
  PROBLEMA_REAL:           { tone: "danger",  label: "Problema real",          icon: AlertOctagon },
  ESTANCAMIENTO:           { tone: "warning", label: "Estancamiento",          icon: TrendingDown },
};

// Severidad de alertas (crítica > alta > media).
export const SEVERIDAD_ALERTA: Record<AlertaSeveridad, CodigoMeta> = {
  CRITICA: { tone: "danger",  label: "Crítica", icon: AlertOctagon   },
  ALTA:    { tone: "warning", label: "Alta",    icon: AlertTriangle  },
  MEDIA:   { tone: "info",    label: "Media",   icon: Info           },
};

// Cobertura de costos (banner del header).
export const COBERTURA: Record<CoberturaEstado, CodigoMeta> = {
  OK:          { tone: "success", label: "OK",          icon: ShieldCheck },
  ADVERTENCIA: { tone: "warning", label: "Advertencia", icon: ShieldAlert },
  CRITICA:     { tone: "danger",  label: "Crítica",     icon: ShieldX     },
};

// Rol de una categoría dentro del 80/20.
export const ROL_TARGET: Record<TargetRol, CodigoMeta> = {
  motor_1:     { tone: "primary", label: "Motor 1",     icon: Zap         },
  motor_2:     { tone: "primary", label: "Motor 2",     icon: Zap         },
  motor_3:     { tone: "primary", label: "Motor 3",     icon: Zap         },
  motor_4:     { tone: "primary", label: "Motor 4",     icon: Zap         },
  fijo:        { tone: "success", label: "Fijo",        icon: Activity    },
  complemento: { tone: "neutral", label: "Complemento", icon: Circle      },
  upsell:      { tone: "violet",  label: "Upsell",      icon: Sparkles    },
};

// Tendencia de una categoría (30d vs YoY).
export const TENDENCIA: Record<TendenciaCategoria, CodigoMeta> = {
  subiendo: { tone: "success", label: "Subiendo", icon: ArrowUp    },
  estable:  { tone: "neutral", label: "Estable",  icon: ArrowRight },
  bajando:  { tone: "danger",  label: "Bajando",  icon: ArrowDown  },
  hueco:    { tone: "danger",  label: "Hueco",    icon: Minus      },
  nuevo:    { tone: "info",    label: "Nuevo",    icon: Sprout     },
};

// Estado del rango de SKUs (bloque 80/20).
export const SKUS_ESTADO: Record<SkusEstado, CodigoMeta> = {
  OK:            { tone: "success", label: "OK",             icon: CheckCircle2 },
  FALTAN_SKUS:   { tone: "warning", label: "Faltan SKUs",    icon: AlertTriangle },
  EXCESO_SKUS:   { tone: "warning", label: "Exceso de SKUs", icon: AlertTriangle },
};

// Bucket de edad del catálogo.
export const COMPOSICION_BUCKET: Record<Exclude<ComposicionBucket, string>, CodigoMeta> = {
  nuevo:    { tone: "success", label: "Nuevo (≤90 días)",   icon: Sprout       },
  reciente: { tone: "info",    label: "Reciente (91-365d)", icon: Activity     },
  clasico:  { tone: "neutral", label: "Clásico (>365d)",    icon: Circle       },
};

// Umbrales para colorear un delta genérico (%). Ajustables globalmente.
export const DELTA_THRESHOLDS = {
  strong_up: 5,      // >+5% → success intenso
  weak_up: 0.5,      // +0.5% a +5% → success suave
  neutral: 0.5,      // ±0.5% → neutral
  weak_down: -0.5,   // -0.5% a -5% → warning
  strong_down: -5,   // <-5% → danger
} as const;
