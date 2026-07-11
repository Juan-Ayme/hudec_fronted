"use client";

import { cn } from "@/lib/utils";
import { PremiumLoaderOverlay, shmr } from "@/components/ui/premium-skeleton";

export function GraficosSkeleton() {
  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-soft pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Analítica Visual</h1>
          <p className="text-sm text-muted">Explora la evolución y distribución de tus ventas en detalle.</p>
        </div>
        <div className={cn("h-10 w-48 rounded-lg border border-white/5", shmr)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 opacity-50 pointer-events-none">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("h-[104px] rounded-xl border border-white/5", shmr)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 opacity-50 pointer-events-none">
        <div className="md:col-span-12">
          <div className={cn("h-[430px] rounded-2xl border border-white/5", shmr)} />
        </div>
        <div className="md:col-span-6">
          <div className={cn("h-[380px] rounded-2xl border border-white/5", shmr)} />
        </div>
        <div className="md:col-span-6">
          <div className={cn("h-[380px] rounded-2xl border border-white/5", shmr)} />
        </div>
        <div className="md:col-span-12">
          <div className={cn("h-[480px] rounded-2xl border border-white/5", shmr)} />
        </div>
      </div>

      <PremiumLoaderOverlay messages={[
        "Construyendo analíticas visuales...",
        "Cruzando datos por departamento...",
        "Calculando anatomía del ticket...",
        "Procesando ranking de categorías..."
      ]} />
    </div>
  );
}
