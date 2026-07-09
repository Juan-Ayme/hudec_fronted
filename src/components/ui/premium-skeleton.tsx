"use client";

import { useState, useEffect } from "react";

export const shmr = "bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-shimmer";

/**
 * Escena animada SVG: dos personitas analizando datos.
 * Animaciones puras CSS — sin librerías externas.
 */
function WorkingPeopleScene() {
  return (
    <div className="relative h-20 w-28">
      <svg
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        aria-hidden="true"
      >
        {/* ── Monitor / Pantalla ── */}
        <rect x="30" y="8" width="38" height="28" rx="3" className="fill-surface-2 stroke-primary/30" strokeWidth="1.5" />
        {/* Soporte del monitor */}
        <rect x="45" y="36" width="8" height="5" rx="1" className="fill-surface-3" />
        <rect x="40" y="40" width="18" height="2" rx="1" className="fill-surface-3" />

        {/* ── Barras del gráfico animadas ── */}
        <rect x="35" y="26" width="5" height="0" rx="1" className="fill-primary/80">
          <animate attributeName="height" values="0;10;6;10;0" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="y" values="26;16;20;16;26" dur="2.5s" repeatCount="indefinite" />
        </rect>
        <rect x="42" y="26" width="5" height="0" rx="1" className="fill-accent/80">
          <animate attributeName="height" values="0;14;8;14;0" dur="2.5s" repeatCount="indefinite" begin="0.3s" />
          <animate attributeName="y" values="26;12;18;12;26" dur="2.5s" repeatCount="indefinite" begin="0.3s" />
        </rect>
        <rect x="49" y="26" width="5" height="0" rx="1" className="fill-success/80">
          <animate attributeName="height" values="0;7;12;7;0" dur="2.5s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="y" values="26;19;14;19;26" dur="2.5s" repeatCount="indefinite" begin="0.6s" />
        </rect>
        <rect x="56" y="26" width="5" height="0" rx="1" className="fill-primary/60">
          <animate attributeName="height" values="0;11;5;11;0" dur="2.5s" repeatCount="indefinite" begin="0.9s" />
          <animate attributeName="y" values="26;15;21;15;26" dur="2.5s" repeatCount="indefinite" begin="0.9s" />
        </rect>

        {/* ── Persona 1 (izquierda, sentada trabajando) ── */}
        {/* Cabeza */}
        <circle cx="18" cy="30" r="6" className="fill-primary/25 stroke-primary/50" strokeWidth="1" />
        {/* Cuerpo */}
        <path d="M12 40 Q18 36 24 40 L22 55 H14 Z" className="fill-primary/15 stroke-primary/40" strokeWidth="0.8" />
        {/* Brazo que tipea */}
        <path d="M22 44 L30 42" className="stroke-primary/40" strokeWidth="1.2" strokeLinecap="round">
          <animate attributeName="d" values="M22 44 L30 42;M22 44 L30 40;M22 44 L30 42" dur="0.6s" repeatCount="indefinite" />
        </path>
        {/* Otro brazo */}
        <path d="M14 44 L10 48" className="stroke-primary/40" strokeWidth="1.2" strokeLinecap="round" />
        {/* Silla */}
        <path d="M11 52 Q18 56 25 52" className="stroke-surface-4/60" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* ── Persona 2 (derecha, revisando datos) ── */}
        {/* Cabeza */}
        <circle cx="88" cy="28" r="6" className="fill-accent/25 stroke-accent/50" strokeWidth="1" />
        {/* Cuerpo */}
        <path d="M82 38 Q88 34 94 38 L92 55 H84 Z" className="fill-accent/15 stroke-accent/40" strokeWidth="0.8" />
        {/* Brazo derecho con documento */}
        <path d="M92 42 L100 38" className="stroke-accent/40" strokeWidth="1.2" strokeLinecap="round">
          <animate attributeName="d" values="M92 42 L100 38;M92 42 L100 36;M92 42 L100 38" dur="2s" repeatCount="indefinite" />
        </path>
        {/* Brazo izquierdo señalando pantalla */}
        <path d="M84 42 L70 32" className="stroke-accent/40" strokeWidth="1.2" strokeLinecap="round">
          <animate attributeName="d" values="M84 42 L70 32;M84 42 L68 30;M84 42 L70 32" dur="3s" repeatCount="indefinite" />
        </path>

        {/* ── Documento / clipboard persona 2 ── */}
        <rect x="97" y="32" width="10" height="14" rx="1.5" className="fill-surface-2/80 stroke-accent/30" strokeWidth="0.8">
          <animateTransform attributeName="transform" type="rotate" values="-5 102 39;5 102 39;-5 102 39" dur="2s" repeatCount="indefinite" />
        </rect>
        {/* Líneas del documento */}
        <line x1="99" y1="36" x2="105" y2="36" className="stroke-accent/30" strokeWidth="0.8" />
        <line x1="99" y1="39" x2="104" y2="39" className="stroke-accent/20" strokeWidth="0.8" />
        <line x1="99" y1="42" x2="105" y2="42" className="stroke-accent/20" strokeWidth="0.8" />

        {/* ── Partículas de datos flotando ── */}
        <circle cx="50" cy="3" r="1.5" className="fill-primary/50">
          <animate attributeName="cy" values="5;0;5" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="62" cy="6" r="1" className="fill-accent/40">
          <animate attributeName="cy" values="6;2;6" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
          <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
        </circle>
        <circle cx="40" cy="4" r="1.2" className="fill-success/40">
          <animate attributeName="cy" values="4;1;4" dur="2.8s" repeatCount="indefinite" begin="1s" />
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.8s" repeatCount="indefinite" begin="1s" />
        </circle>

        {/* ── Escritorio / mesa ── */}
        <line x1="5" y1="56" x2="115" y2="56" className="stroke-surface-3/60" strokeWidth="1.5" strokeLinecap="round" />
        {/* Pata izquierda */}
        <line x1="10" y1="56" x2="10" y2="72" className="stroke-surface-3/40" strokeWidth="1.2" />
        {/* Pata derecha */}
        <line x1="110" y1="56" x2="110" y2="72" className="stroke-surface-3/40" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

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
      <div className="flex flex-col items-center gap-3 bg-surface/80 px-8 py-6 rounded-3xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <WorkingPeopleScene />
        <p
          key={loadingMsgIdx}
          className="text-sm font-semibold text-fg tracking-wide animate-splash-fade-up"
        >
          {activeMessage}
        </p>
      </div>
    </div>
  );
}
