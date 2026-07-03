"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimeLoader({
  className,
  label = "Cargando datos...",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[50vh] w-full gap-6",
        "animate-[fade-in_var(--duration-slow)_var(--ease-premium)]",
        className
      )}
    >
      <div className="relative">
        {/* Glow de fondo */}
        <div className="absolute inset-0 bg-violet/20 blur-3xl rounded-full" />
        
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          className="relative z-10 overflow-visible drop-shadow-xl"
        >
          {/* Polígono central */}
          <motion.polygon
            className="text-primary"
            points="50,10 90,30 90,70 50,90 10,70 10,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
          />
          
          {/* Líneas internas */}
          {[
            { x1: 50, y1: 50, x2: 50, y2: 10 },
            { x1: 50, y1: 50, x2: 90, y2: 70 },
            { x1: 50, y1: 50, x2: 10, y2: 70 },
          ].map((line, i) => (
            <motion.line
              key={i}
              className="text-violet"
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Puntos (nodos de la jerarquía) */}
          {[
            { cx: 50, cy: 10, className: "text-primary" },
            { cx: 90, cy: 30, className: "text-violet" },
            { cx: 90, cy: 70, className: "text-info" },
            { cx: 50, cy: 90, className: "text-primary" },
            { cx: 10, cy: 70, className: "text-info" },
            { cx: 10, cy: 30, className: "text-violet" },
            { cx: 50, cy: 50, className: "text-white" },
          ].map((dot, i) => (
            <motion.circle
              key={i}
              className={dot.className}
              cx={dot.cx}
              cy={dot.cy}
              r={i === 6 ? 5 : 4} // El centro es un poco más grande
              fill="currentColor"
              initial={{ scale: 0.8, opacity: 0.3, y: -10 }}
              animate={{ scale: 1.2, opacity: 1, y: 10 }}
              transition={{
                duration: 1,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
                delay: i * 0.15,
              }}
            />
          ))}
        </svg>
      </div>

      <motion.p
        className="text-sm font-semibold tracking-widest uppercase text-muted"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "mirror",
        }}
      >
        {label}
      </motion.p>
    </div>
  );
}
