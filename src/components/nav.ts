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
  Settings,
  ShoppingCart,
  History,
  Users,
  type LucideIcon,
} from "lucide-react";

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
      { href: "/graficos", label: "Gráficos Avanzados", icon: Activity },
      // ENLACES COMENTADOS (2026-06-20) — apuntan a páginas que no existen en src/app/.
      // Reactivar cuando se creen las páginas correspondientes.
      // { href: "/stock", label: "Stock", icon: Boxes },
      // { href: "/ventas", label: "Ventas", icon: Receipt },
      { href: "/ventas-jerarquicas", label: "Análisis de Ventas", icon: LayoutGrid },
      // { href: "/matrices", label: "Matrices KAWII", icon: Table2 },
    ],
  },
  {
    title: "Reportes",
    items: [
      { href: "/compras-catalogo", label: "Gestión de Compras", icon: ShoppingCart },
      { href: "/rotacion-historica", label: "Análisis de Rotación", icon: History },
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
      { href: "/pulso", label: "Pulso Operativo", icon: Activity },
      { href: "/diagnostico", label: "Diagnóstico Inteligente", icon: Gauge },
      { href: "/salud-catalogo", label: "Auditoría de Salud", icon: ShieldCheck },
      { href: "/plan-mes", label: "Planificación Estratégica", icon: CalendarClock },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { href: "/auditorias", label: "Auditorías", icon: ShieldCheck },
      { href: "/sync", label: "Sincronización", icon: RefreshCw },
      { href: "/configuracion", label: "Configuración", icon: Settings },
      { href: "/usuarios", label: "Usuarios", icon: Users },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
