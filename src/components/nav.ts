import {
  LayoutDashboard,
  Package,
  // Boxes,    // usado solo por enlace /stock (comentado)
  // Receipt,  // usado solo por enlace /ventas (comentado)
  // Table2,   // usado solo por enlace /matrices (comentado)
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
    // Contiene páginas experimentales + versiones legacy previas al módulo BI.
    // Los "(legacy)" quedan visibles pero desincentivados: sus reemplazos son
    // /pulso y /diagnostico dentro del grupo BI.
    title: "Beta / Legacy",
    items: [
      { href: "/productos", label: "Productos", icon: Package },
      { href: "/reportes/tablero", label: "Tablero Semanal (legacy)", icon: Gauge },
      { href: "/reportes/diario", label: "Reporte Diario (legacy)", icon: CalendarClock },
      { href: "/simulador", label: "Simulador Cascada", icon: Activity },
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
