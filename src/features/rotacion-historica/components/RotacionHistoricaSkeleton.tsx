"use client";

import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { PremiumLoaderOverlay, shmr } from "@/components/ui/premium-skeleton";

export function RotacionHistoricaSkeleton({
  sucursalName,
}: {
  sucursalName: string | null;
}) {
  return (
    <div className="relative">
      <PageHeader
        eyebrow="Reportes · Análisis retrospectivo"
        title="Rotación Histórica"
        description={
          sucursalName
            ? `Productos vendidos en la ventana seleccionada — ${sucursalName}`
            : "Productos vendidos en la ventana seleccionada (consolidado de todas las tiendas)"
        }
      />
      <div className={cn("h-[88px] rounded-xl mb-6 border border-white/5", shmr)} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6 opacity-50 pointer-events-none">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("h-[104px] rounded-xl border border-white/5", shmr)} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 opacity-50 pointer-events-none">
        <div className="lg:col-span-1 flex flex-col gap-4">
           <div className={cn("h-[400px] rounded-xl border border-white/5", shmr)} />
        </div>
        <div className="lg:col-span-3">
           <div className={cn("h-[600px] rounded-xl border border-white/5", shmr)} />
        </div>
      </div>
      <PremiumLoaderOverlay messages={[
        "Revisando ventana histórica...",
        "Calculando rotación de productos...",
        "Segmentando por Pareto (A/B/C)...",
        "Cruzando datos de inventario..."
      ]} />
    </div>
  );
}
