// Mapeo de los veredictos del Ecosistema de Compras a tono/label/icono + una
// explicación en lenguaje de gerente (tooltip). Es propio del módulo: NO reusa
// el VEREDICTO de features/bi/shared, que mapea los códigos de Diagnóstico
// (CRECIENDO_FUERTE…), semánticamente distintos.

import {
  AlertOctagon,
  Boxes,
  CheckCircle2,
  CircleSlash,
  PackageX,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import type { EcosistemaVeredicto } from "@/lib/bi-types";

export interface VeredictoEcoMeta {
  tone: BadgeTone;
  label: string;
  icon: LucideIcon;
  /** Qué significa + qué hacer. Se muestra como tooltip del badge/chip. */
  desc: string;
}

export const VEREDICTO_ECO: Record<EcosistemaVeredicto, VeredictoEcoMeta> = {
  RIESGO_QUIEBRE: {
    tone: "danger",
    label: "Riesgo quiebre",
    icon: AlertOctagon,
    desc: "Menos de 0.5 meses de stock al ritmo de venta actual. Comprar ya.",
  },
  SOBRECOMPRA: {
    tone: "warning",
    label: "Sobrecompra",
    icon: ShoppingCart,
    desc: "Multiplicador < 1.5 — se compró de más para lo que rota.",
  },
  EXCESO_STOCK: {
    tone: "info",
    label: "Exceso de stock",
    icon: Boxes,
    desc: "Más de 2.5 meses de cobertura — capital dormido, conviene promocionar.",
  },
  SIN_REPOSICION: {
    tone: "violet",
    label: "Sin reposición",
    icon: PackageX,
    desc: "Vendió pero no se compró en la ventana — revisar si falta reponer.",
  },
  SIN_MOVIMIENTO: {
    tone: "neutral",
    label: "Sin movimiento",
    icon: CircleSlash,
    desc: "Ni compra ni venta en la ventana — catálogo inactivo.",
  },
  EQUILIBRADO: {
    tone: "success",
    label: "Equilibrado",
    icon: CheckCircle2,
    desc: "Sin banderas — compra, venta y stock en balance.",
  },
};

/** Orden por severidad/accionabilidad — para los chips de resumen y el orden del filtro. */
export const VEREDICTO_ECO_ORDER: EcosistemaVeredicto[] = [
  "RIESGO_QUIEBRE",
  "SOBRECOMPRA",
  "EXCESO_STOCK",
  "SIN_REPOSICION",
  "SIN_MOVIMIENTO",
  "EQUILIBRADO",
];
