"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export const shmr = "bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer";

export function PremiumLoaderOverlay({
  messages,
}: {
  messages: string[];
}) {
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages]);

  const activeMessage = messages[loadingMsgIdx] || "Cargando...";

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/20 backdrop-blur-[2px] rounded-2xl animate-[fade-in_var(--duration-slow)_ease-out] pointer-events-none">
      <div className="flex flex-col items-center gap-4 bg-surface/80 px-8 py-6 rounded-3xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-fg tracking-wide animate-pulse transition-all duration-500">
          {activeMessage}
        </p>
      </div>
    </div>
  );
}
