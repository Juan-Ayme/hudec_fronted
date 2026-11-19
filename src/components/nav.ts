import {
  LayoutDashboard,
  FolderTree,
  RefreshCw,
  PackageSearch,
  Settings,
  Boxes,
  Truck,
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
    // arriba, PDF con gráficos, Excel con el detalle y el vistazo ejecutivo.
    title: "Decidir",
    items: [
      { href: "/informes", label: "Informes", icon: FileText },
      { href: "/", label: "Resumen Ejecutivo", icon: LayoutDashboard },
    ],
  },
  {
    title: "Catálogo & Stock",
    items: [
      { href: "/centro-catalogo", label: "Centro de Catálogo", icon: PackageSearch },
      { href: "/inventario-excel", label: "Inventario & Depuración", icon: Boxes },
      { href: "/traslados", label: "Traslados", icon: Truck },
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
