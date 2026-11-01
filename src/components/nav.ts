import {
  LayoutDashboard,
  FolderTree,
  Tags,
  ShieldCheck,
  RefreshCw,
  Activity,
  CalendarClock,
  Gauge,
  PackageSearch,
  Settings,
  Users,
  History,
  TrendingUp,
  CircleDollarSign,
  ArrowLeftRight,
  FileSpreadsheet,
  Boxes,
  ShoppingBag,
  BarChart3,
  ClipboardCheck,
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
      { href: "/reporte-ventas", label: "Reporte de Ventas", icon: FileSpreadsheet },
      { href: "/compras-ecosistema", label: "Ecosistema de Compras", icon: ArrowLeftRight },
      { href: "/compras-historico", label: "Compras Histórico", icon: ShoppingBag },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/centro-catalogo", label: "Centro de Catálogo", icon: PackageSearch },
      { href: "/inventario-excel", label: "Inventario & Depuración", icon: Boxes },
      { href: "/taxonomia", label: "Estructura de Catálogo", icon: FolderTree },
      { href: "/product-types", label: "Tipologías de Producto", icon: Tags },
    ],
  },
  {
    title: "BI",
    items: [
      { href: "/pulso", label: "Pulso Operativo", icon: Activity },
      { href: "/diagnostico", label: "Diagnóstico Inteligente", icon: Gauge },
      { href: "/salud-catalogo", label: "Auditoría de Salud", icon: ShieldCheck },
      { href: "/plan-mes", label: "Planificación Estratégica", icon: CalendarClock },
      { href: "/rotacion-historica", label: "Análisis de Rotación", icon: History },
      { href: "/rentabilidad", label: "Rentabilidad", icon: TrendingUp },
      { href: "/graficos", label: "Gráficos Avanzados", icon: BarChart3 },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { href: "/auditorias", label: "Auditorías", icon: ClipboardCheck },
      { href: "/auditoria-costos", label: "Auditoría de Costos", icon: CircleDollarSign },
      { href: "/sync", label: "Sincronización", icon: RefreshCw },
      { href: "/configuracion", label: "Configuración", icon: Settings },
      { href: "/usuarios", label: "Usuarios", icon: Users },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Rutas que ve un `viewer` (encargado de tienda). El resto queda oculto. */
const VIEWER_HREFS = new Set<string>([
  "/",
  "/centro-catalogo",
  "/pulso",
  "/taxonomia",
  "/reporte-ventas",
]);

/** Grupos de navegación visibles según el rol en la empresa activa.
 *  viewer → solo las vistas operativas de su tienda; admin/operador → todo. */
export function navGroupsForRole(role: UserRole | null): NavGroup[] {
  if (role !== "viewer" && role !== null) return NAV_GROUPS;
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => VIEWER_HREFS.has(i.href)),
  })).filter((g) => g.items.length > 0);
}
