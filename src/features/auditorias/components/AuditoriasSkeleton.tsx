"use client";

import { cn } from "@/lib/utils";
import { PremiumLoaderOverlay, shmr } from "@/components/ui/premium-skeleton";

export function AuditoriasSkeleton() {
  return (
    <div className="relative">
      <div className={cn("h-[64px] rounded-xl mb-6 border border-white/5", shmr)} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 opacity-50 pointer-events-none">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn("h-[104px] rounded-xl border border-white/5", shmr)} />
        ))}
      </div>
      <div className="opacity-50 pointer-events-none space-y-4">
         {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn("h-[80px] rounded-xl border border-white/5", shmr)} />
         ))}
      </div>
      <PremiumLoaderOverlay messages={[
        "Buscando anomalías de stock...",
        "Verificando códigos de barra...",
        "Cruzando catálogos...",
        "Validando tipos de producto..."
      ]} />
    </div>
  );
}
