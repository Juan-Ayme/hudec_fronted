import {
  LayoutDashboard,

  LayoutGrid,
  FolderTree,
  Tags,
  ShieldCheck,
  RefreshCw,
  Activity,
  CalendarClock,
  Gauge,
  PackageSearch,
  Settings,
  ShoppingCart,
  History,
  Users,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/api";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Análisis",
    items: [
      { href: "/", label: "Resumen Ejecutivo", icon: LayoutDashboard },
      // ENLACES COMENTADOS (2026-06-20) — apuntan a páginas que no existen en src/app/.
      // Reactivar cuando se creen las páginas correspondientes.
      // { href: "/stock", label: "Stock", icon: Boxes },
      // { href: "/ventas", label: "Ventas", icon: Receipt },
      // Fusión de Análisis de Ventas + Gestión de Compras (árbol + pestañas).
      { href: "/centro-catalogo", label: "Centro de Catálogo", icon: PackageSearch },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/taxonomia", label: "Estructura de Catálogo", icon: FolderTree },
      { href: "/product-types", label: "Tipologías de Producto", icon: Tags },
    ],
  },
  {
    title: "BI",
    items: [
      { href: "/graficos", label: "Gráficos Avanzados", icon: Activity },
      { href: "/pulso", label: "Pulso Operativo", icon: Activity },
      { href: "/diagnostico", label: "Diagnóstico Inteligente", icon: Gauge },
      { href: "/salud-catalogo", label: "Auditoría de Salud", icon: ShieldCheck },
      { href: "/plan-mes", label: "Planificación Estratégica", icon: CalendarClock },
      { href: "/rotacion-historica", label: "Análisis de Rotación", icon: History },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { href: "/auditorias", label: "Auditorías", icon: ShieldCheck },
      { href: "/auditoria-costos", label: "Auditoría de Costos", icon: CircleDollarSign },
      { href: "/sync", label: "Sincronización", icon: RefreshCw },
      { href: "/configuracion", label: "Configuración", icon: Settings },
      { href: "/usuarios", label: "Usuarios", icon: Users },
    ],
  },
  {
    title: "Legacy",
    items: [
      { href: "/ventas-jerarquicas", label: "Análisis de Ventas", icon: LayoutGrid },
      { href: "/compras-catalogo", label: "Gestión de Compras", icon: ShoppingCart },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Rutas que ve un `viewer` (encargado de tienda). El resto queda oculto. */
const VIEWER_HREFS = new Set<string>(["/centro-catalogo", "/compras-catalogo", "/pulso"]);

/** Grupos de navegación visibles según el rol en la empresa activa.
 *  viewer → solo las vistas operativas de su tienda; admin/operador → todo. */
export function navGroupsForRole(role: UserRole | null): NavGroup[] {
  if (role !== "viewer") return NAV_GROUPS;
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => VIEWER_HREFS.has(i.href)),
  })).filter((g) => g.items.length > 0);
}
