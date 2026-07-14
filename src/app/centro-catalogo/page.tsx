"use client";

/**
 * Centro de Control de Catálogo — fusión de /ventas-jerarquicas y
 * /compras-catalogo en una sola vista con árbol compartido + pestañas.
 *
 * El <Suspense> es obligatorio: la vista usa useSearchParams() (estado en la
 * URL) y sin boundary `next build` falla en páginas estáticas (mismo patrón
 * que /login).
 */
import { Suspense } from "react";
import { CentroCatalogoView } from "@/features/centro-catalogo/components/CentroCatalogoView";

export default function CentroCatalogoPage() {
  return (
    <Suspense fallback={null}>
      <CentroCatalogoView />
    </Suspense>
  );
}
