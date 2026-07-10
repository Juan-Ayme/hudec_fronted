import type { ReporteGerencialTipo } from "@/lib/api";

/* Catálogo de los 3 Informes Gerenciales (1 Excel por informe).
 * Cada Excel abre con una hoja 🎯 Resumen en lenguaje simple (KPIs + "cómo
 * leer este informe") pensada para gerencia, seguida de una pestaña por
 * departamento con semáforos y autofiltro.
 * Consumido por ComprasView (el dropdown se arma inline en esa vista). */
export const INFORMES_GERENCIALES: {
  tipo: ReporteGerencialTipo;
  label: string;
  desc: string;
  file: string;
}[] = [
  {
    tipo: "por-agotarse",
    label: "🔴 Por agotarse (<10 días)",
    desc: "Se venden rápido y el stock no llega a 10 días",
    file: "por_agotarse.xlsx",
  },
  {
    tipo: "estancados",
    label: "🧊 Inventario estancado",
    desc: "Stock que no se vende y cuánta plata inmoviliza",
    file: "inventario_estancado.xlsx",
  },
  {
    tipo: "rotacion",
    label: "🔄 Rotación de productos",
    desc: "Qué tan seguido se vende cada producto",
    file: "rotacion_productos.xlsx",
  },
];
