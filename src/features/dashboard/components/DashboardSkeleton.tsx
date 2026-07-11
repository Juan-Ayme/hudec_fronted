"use client";

import { cn } from "@/lib/utils";
import { PremiumLoaderOverlay, shmr } from "@/components/ui/premium-skeleton";

export function DashboardSkeleton() {
  return (
    <div className="relative">
      <div className="flex justify-end mb-6">
        <div className={cn("h-10 w-48 rounded-lg border border-white/5", shmr)} />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:grid-rows-auto opacity-50 pointer-events-none">
        <div className="md:col-span-3 flex flex-col gap-3">
          <div className={cn("h-[104px] rounded-xl border border-white/5", shmr)} />
          <div className={cn("h-[104px] rounded-xl border border-white/5", shmr)} />
          <div className={cn("h-[104px] rounded-xl border border-white/5", shmr)} />
        </div>
        <div className="md:col-span-9">
          <div className={cn("h-[340px] rounded-2xl border border-white/5", shmr)} />
        </div>
        <div className="md:col-span-7">
          <div className={cn("h-[340px] rounded-2xl border border-white/5", shmr)} />
        </div>
        <div className="md:col-span-5">
          <div className={cn("h-[340px] rounded-2xl border border-white/5", shmr)} />
        </div>
        <div className="md:col-span-7">
          <div className={cn("h-[340px] rounded-2xl border border-white/5", shmr)} />
        </div>
        <div className="md:col-span-5 flex flex-col gap-5">
          <div className={cn("h-[104px] rounded-xl border border-white/5", shmr)} />
          <div className={cn("h-[216px] rounded-2xl border border-white/5", shmr)} />
        </div>
      </div>
      <PremiumLoaderOverlay messages={[
        "Analizando ventas del día...",
        "Calculando ticket promedio...",
        "Valorizando stock actual...",
        "Consolidando métricas..."
      ]} />
    </div>
  );
}
