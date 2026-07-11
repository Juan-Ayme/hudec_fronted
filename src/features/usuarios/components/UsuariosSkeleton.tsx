"use client";

import { cn } from "@/lib/utils";
import { PremiumLoaderOverlay, shmr } from "@/components/ui/premium-skeleton";

export function UsuariosSkeleton() {
  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none space-y-4">
         {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn("h-16 rounded-xl border border-white/5", shmr)} />
         ))}
      </div>
      <PremiumLoaderOverlay messages={[
        "Obteniendo lista de usuarios...",
        "Verificando permisos y roles...",
        "Construyendo tabla de accesos..."
      ]} />
    </div>
  );
}
