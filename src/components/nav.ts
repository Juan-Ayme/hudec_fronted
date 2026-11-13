import {
  LayoutDashboard,
  FolderTree,
  RefreshCw,
  Activity,
  PackageSearch,
  Settings,
  ArrowLeftRight,
  FileSpreadsheet,
  Boxes,
  FileText,
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
    // Lo que gerencia necesita para decidir: informes con la conclusión
    // arriba, PDF con gráficos y Excel con el detalle.
    title: "Decidir",
    items: [
      { href: "/informes", label: "Informes", icon: FileText },
    ],
  },
  {
    title: "Comercial & BI",
    items: [
      { href: "/", label: "Resumen Ejecutivo", icon: LayoutDashboard },
      { href: "/pulso", label: "Inteligencia BI", icon: Activity },
      { href: "/reporte-ventas", label: "Ventas & Rentabilidad", icon: FileSpreadsheet },
      { href: "/compras-ecosistema", label: "Compras & Recepciones", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Catálogo & Stock",
    items: [
      { href: "/centro-catalogo", label: "Centro de Catálogo", icon: PackageSearch },
      { href: "/inventario-excel", label: "Inventario & Depuración", icon: Boxes },
      { href: "/taxonomia", label: "Taxonomía & Clasificación", icon: FolderTree },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/sync", label: "Sincronización BSale", icon: RefreshCw },
      { href: "/configuracion", label: "Configuración & Admin", icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Rutas que ve un `viewer` (encargado de tienda). El resto queda oculto. */
const VIEWER_HREFS = new Set<string>([
  "/informes",
  "/",
  "/pulso",
  "/reporte-ventas",
  "/centro-catalogo",
  "/taxonomia",
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
