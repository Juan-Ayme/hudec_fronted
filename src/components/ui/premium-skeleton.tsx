"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const shmr = "bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer";

export type LoaderVariant = "analytics" | "neural" | "growth" | "database" | "radar" | "people" | "auto";
export type LoaderPosition = "bottom" | "bottom-right" | "bottom-left" | "center";

/**
 * ── SVG 1: Analytics Pulse & Radar Chart ──
 */
export function AnalyticsPulseScene() {
  return (
    <div className="relative h-12 w-16 md:h-14 md:w-20">
      <svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
        {/* Fondo de rejilla táctica */}
        <line x1="10" y1="55" x2="90" y2="55" className="stroke-white/10" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="10" y1="35" x2="90" y2="35" className="stroke-white/10" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="10" y1="15" x2="90" y2="15" className="stroke-white/10" strokeWidth="1" strokeDasharray="3 3" />

        {/* Barras animadas */}
        <rect x="18" y="25" width="8" height="30" rx="2" className="fill-primary/40">
          <animate attributeName="height" values="30;15;40;20;30" dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="y" values="25;40;15;35;25" dur="2.8s" repeatCount="indefinite" />
        </rect>
        <rect x="32" y="15" width="8" height="40" rx="2" className="fill-accent/60">
          <animate attributeName="height" values="40;20;45;15;40" dur="2.4s" repeatCount="indefinite" begin="0.2s" />
          <animate attributeName="y" values="15;35;10;40;15" dur="2.4s" repeatCount="indefinite" begin="0.2s" />
        </rect>
        <rect x="46" y="30" width="8" height="25" rx="2" className="fill-success/50">
          <animate attributeName="height" values="25;42;18;35;25" dur="3s" repeatCount="indefinite" begin="0.4s" />
          <animate attributeName="y" values="30;13;37;20;30" dur="3s" repeatCount="indefinite" begin="0.4s" />
        </rect>
        <rect x="60" y="20" width="8" height="35" rx="2" className="fill-primary/80">
          <animate attributeName="height" values="35;18;42;22;35" dur="2.6s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="y" values="20;37;13;33;20" dur="2.6s" repeatCount="indefinite" begin="0.6s" />
        </rect>

        {/* Línea de pulso/tendencia */}
        <path d="M15 45 L32 25 L48 35 L65 18 L85 28" className="stroke-accent" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <animate attributeName="stroke-dasharray" values="0,150;150,0" dur="3s" repeatCount="indefinite" />
        </path>

        {/* Partícula de datos resplandeciente flotante */}
        <circle cx="65" cy="18" r="3" className="fill-accent">
          <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {/* Eje Base */}
        <line x1="10" y1="58" x2="90" y2="58" className="stroke-primary/40" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * ── SVG 2: Neural AI Data Stream ──
 */
export function NeuralNetworkScene() {
  return (
    <div className="relative h-12 w-16 md:h-14 md:w-20">
      <svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
        {/* Anillo Orbital Central */}
        <circle cx="50" cy="35" r="22" className="stroke-primary/30" strokeWidth="1.5" strokeDasharray="4 4">
          <animateTransform attributeName="transform" type="rotate" from="0 50 35" to="360 50 35" dur="12s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="35" r="14" className="stroke-accent/40" strokeWidth="1.5" strokeDasharray="6 3">
          <animateTransform attributeName="transform" type="rotate" from="360 50 35" to="0 50 35" dur="8s" repeatCount="indefinite" />
        </circle>

        {/* Líneas Conectoras de Red */}
        <path d="M20 20 L50 35 L80 20 M20 50 L50 35 L80 50 M50 12 L50 58" className="stroke-primary/25" strokeWidth="1" />

        {/* Nodos Externeos con animación de resplandor */}
        <circle cx="20" cy="20" r="4" className="fill-primary stroke-white/40" strokeWidth="1">
          <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="20" r="4" className="fill-accent stroke-white/40" strokeWidth="1">
          <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" begin="0.5s" />
        </circle>
        <circle cx="20" cy="50" r="4" className="fill-accent stroke-white/40" strokeWidth="1">
          <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" begin="1s" />
        </circle>
        <circle cx="80" cy="50" r="4" className="fill-success stroke-white/40" strokeWidth="1">
          <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" begin="1.5s" />
        </circle>

        {/* Nodo Núcleo AI */}
        <circle cx="50" cy="35" r="7" className="fill-primary/90">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="35" r="3" className="fill-white" />
      </svg>
    </div>
  );
}

/**
 * ── SVG 3: Growth Trend & Metrics ──
 */
export function GrowthTrendScene() {
  return (
    <div className="relative h-12 w-16 md:h-14 md:w-20">
      <svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
        {/* Curva de Crecimiento Ascendente */}
        <path d="M12 52 Q 35 48, 50 32 T 88 12" className="stroke-success" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M12 52 Q 35 48, 50 32 T 88 12 L 88 58 L 12 58 Z" className="fill-success/15" />

        {/* Flecha indicadora superior */}
        <path d="M80 12 L88 12 L88 20" className="stroke-success" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Puntos de Hito en la Curva */}
        <circle cx="32" cy="45" r="3.5" className="fill-surface-1 stroke-success" strokeWidth="2" />
        <circle cx="50" cy="32" r="3.5" className="fill-surface-1 stroke-success" strokeWidth="2" />
        <circle cx="70" cy="20" r="3.5" className="fill-surface-1 stroke-success" strokeWidth="2">
          <animate attributeName="r" values="3.5;5.5;3.5" dur="1.8s" repeatCount="indefinite" />
        </circle>

        {/* Destellos de energía flotantes */}
        <circle cx="75" cy="14" r="1.5" className="fill-accent">
          <animate attributeName="cy" values="14;8;14" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="85" cy="25" r="1.2" className="fill-primary">
          <animate attributeName="cy" values="25;18;25" dur="2.4s" repeatCount="indefinite" begin="0.5s" />
        </circle>
      </svg>
    </div>
  );
}

/**
 * ── SVG 4: Database Sync & Cloud Storage ──
 */
export function DatabaseSyncScene() {
  return (
    <div className="relative h-12 w-16 md:h-14 md:w-20">
      <svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
        {/* Disco Base 3 */}
        <ellipse cx="50" cy="52" rx="32" ry="8" className="fill-surface-2 stroke-primary/40" strokeWidth="1.5" />
        <path d="M18 44 C 18 49, 82 49, 82 44 L 82 52 C 82 57, 18 57, 18 52 Z" className="fill-surface-3/80 stroke-primary/40" strokeWidth="1.5" />

        {/* Disco Medio 2 */}
        <ellipse cx="50" cy="36" rx="32" ry="8" className="fill-surface-2 stroke-accent/50" strokeWidth="1.5" />
        <path d="M18 28 C 18 33, 82 33, 82 28 L 82 36 C 82 41, 18 41, 18 36 Z" className="fill-surface-3/80 stroke-accent/50" strokeWidth="1.5" />

        {/* Disco Superior 1 */}
        <ellipse cx="50" cy="20" rx="32" ry="8" className="fill-surface-1 stroke-primary" strokeWidth="1.5" />
        <path d="M18 12 C 18 17, 82 17, 82 12 L 82 20 C 82 25, 18 25, 18 20 Z" className="fill-surface-2 stroke-primary" strokeWidth="1.5" />

        {/* Láser de Escaneo Vertical */}
        <line x1="16" y1="18" x2="84" y2="18" className="stroke-accent" strokeWidth="2">
          <animate attributeName="y1" values="14;50;14" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="y2" values="14;50;14" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" />
        </line>
      </svg>
    </div>
  );
}

/**
 * ── SVG 5: Radar & Anomaly Scanner ──
 */
export function RadarScannerScene() {
  return (
    <div className="relative h-12 w-16 md:h-14 md:w-20">
      <svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
        {/* Círculos Concéntricos del Radar */}
        <circle cx="50" cy="35" r="26" className="stroke-primary/20" strokeWidth="1" />
        <circle cx="50" cy="35" r="17" className="stroke-primary/30" strokeWidth="1" />
        <circle cx="50" cy="35" r="8" className="stroke-primary/40" strokeWidth="1" />

        {/* Cruz del Radar */}
        <line x1="20" y1="35" x2="80" y2="35" className="stroke-white/15" strokeWidth="1" />
        <line x1="50" y1="5" x2="50" y2="65" className="stroke-white/15" strokeWidth="1" />

        {/* Barrido de Radar Giratorio */}
        <line x1="50" y1="35" x2="74" y2="18" className="stroke-accent" strokeWidth="2" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 50 35" to="360 50 35" dur="3s" repeatCount="indefinite" />
        </line>

        {/* Anomalías/Nodos detectados */}
        <circle cx="65" cy="22" r="3" className="fill-accent">
          <animate attributeName="opacity" values="0.1;1;0.1" dur="3s" repeatCount="indefinite" begin="0.3s" />
        </circle>
        <circle cx="38" cy="45" r="2.5" className="fill-success">
          <animate attributeName="opacity" values="0.1;1;0.1" dur="3s" repeatCount="indefinite" begin="1.5s" />
        </circle>
      </svg>
    </div>
  );
}

/**
 * ── SVG 6: Working People Vector Scene (Refined) ──
 */
export function WorkingPeopleScene() {
  return (
    <div className="relative h-12 w-16 md:h-14 md:w-20">
      <svg viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
        {/* Monitor */}
        <rect x="32" y="12" width="36" height="26" rx="3" className="fill-surface-2 stroke-primary/40" strokeWidth="1.5" />
        <rect x="46" y="38" width="8" height="6" rx="1" className="fill-surface-3" />
        <rect x="40" y="44" width="20" height="2" rx="1" className="fill-surface-3" />

        {/* Bars inside monitor */}
        <rect x="38" y="28" width="4" height="6" rx="1" className="fill-primary">
          <animate attributeName="height" values="6;14;6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="y" values="28;20;28" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="45" y="28" width="4" height="10" rx="1" className="fill-accent">
          <animate attributeName="height" values="10;16;10" dur="2.2s" repeatCount="indefinite" begin="0.2s" />
          <animate attributeName="y" values="28;22;28" dur="2.2s" repeatCount="indefinite" begin="0.2s" />
        </rect>
        <rect x="52" y="28" width="4" height="8" rx="1" className="fill-success">
          <animate attributeName="height" values="8;14;8" dur="1.8s" repeatCount="indefinite" begin="0.4s" />
          <animate attributeName="y" values="28;22;28" dur="1.8s" repeatCount="indefinite" begin="0.4s" />
        </rect>

        {/* Person Sitting */}
        <circle cx="18" cy="30" r="5" className="fill-primary/40 stroke-primary" strokeWidth="1" />
        <path d="M12 40 Q18 36 24 40 L22 52 H14 Z" className="fill-primary/20 stroke-primary/60" strokeWidth="1" />

        {/* Person Standing */}
        <circle cx="82" cy="26" r="5" className="fill-accent/40 stroke-accent" strokeWidth="1" />
        <path d="M76 36 Q82 32 88 36 L86 52 H78 Z" className="fill-accent/20 stroke-accent/60" strokeWidth="1" />

        {/* Desk Line */}
        <line x1="8" y1="52" x2="92" y2="52" className="stroke-white/20" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/**
 * Smart resolver for SVG Scene component based on variant or keyword detection
 */
function resolveSceneComponent(variant: LoaderVariant, messages: string[]) {
  if (variant !== "auto") {
    switch (variant) {
      case "neural":
        return NeuralNetworkScene;
      case "growth":
        return GrowthTrendScene;
      case "database":
        return DatabaseSyncScene;
      case "radar":
        return RadarScannerScene;
      case "people":
        return WorkingPeopleScene;
      case "analytics":
      default:
        return AnalyticsPulseScene;
    }
  }

  // Automatic selection based on text context
  const fullText = (messages || []).join(" ").toLowerCase();
  if (fullText.includes("anomalía") || fullText.includes("código") || fullText.includes("verific") || fullText.includes("audit")) {
    return RadarScannerScene;
  }
  if (fullText.includes("usuario") || fullText.includes("permiso") || fullText.includes("rol") || fullText.includes("red")) {
    return NeuralNetworkScene;
  }
  if (fullText.includes("ventas") || fullText.includes("ticket") || fullText.includes("rotación") || fullText.includes("crecimient")) {
    return GrowthTrendScene;
  }
  if (fullText.includes("stock") || fullText.includes("catálogo") || fullText.includes("compra") || fullText.includes("artículo")) {
    return DatabaseSyncScene;
  }
  return AnalyticsPulseScene;
}

export function PremiumLoaderOverlay({
  messages,
  variant = "auto",
  position = "center",
  className,
}: {
  messages: string[];
  variant?: LoaderVariant;
  position?: LoaderPosition;
  className?: string;
}) {
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages]);

  const activeMessage = messages[loadingMsgIdx] || "Procesando...";
  const SceneComponent = resolveSceneComponent(variant, messages);

  // Layout styling based on position prop (Defaults to "bottom")
  const positionClasses = {
    bottom: "items-end justify-center pb-6 md:pb-8",
    "bottom-right": "items-end justify-end pb-6 pr-6 md:pb-8 md:pr-8",
    "bottom-left": "items-end justify-start pb-6 pl-6 md:pb-8 md:pl-8",
    center: "items-center justify-center",
  }[position];

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex bg-bg/15 backdrop-blur-[2px] rounded-2xl transition-all duration-300 pointer-events-none",
        positionClasses,
        className
      )}
    >
      <div className="group relative flex items-center gap-4 bg-surface/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_25px_rgba(59,130,246,0.12)] backdrop-blur-2xl px-5 py-3.5 rounded-2xl border-t-primary/50 overflow-hidden animate-[fade-in-up_0.3s_ease-out]">
        {/* Animated top shimmer bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />

        {/* SVG Graphic Scene */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <SceneComponent />
        </div>

        {/* Content Info */}
        <div className="flex flex-col justify-center min-w-[210px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/90">
              HUD Analytics
            </span>
          </div>
          <p
            key={loadingMsgIdx}
            className="text-xs md:text-sm font-medium text-fg tracking-wide animate-splash-fade-up line-clamp-1"
          >
            {activeMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
