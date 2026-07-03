"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ------------------------------
// Loader para Gráficos de Líneas (Dinámica de Ventas)
// ------------------------------
export function LineChartLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center min-h-[200px]", className)}>
      <svg width="120" height="60" viewBox="0 0 120 60" className="opacity-50 text-primary">
        <motion.path
          d="M 10,50 L 30,30 L 50,40 L 70,20 L 90,30 L 110,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
        {/* Glow subyacente */}
        <motion.path
          d="M 10,50 L 30,30 L 50,40 L 70,20 L 90,30 L 110,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="blur-md opacity-20"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
      </svg>
    </div>
  );
}

// ------------------------------
// Loader para Gráficos de Barras (Desempeño por Depto / Sucursales)
// ------------------------------
export function BarChartLoader({ className }: { className?: string }) {
  const bars = [
    { h: 30, delay: 0 },
    { h: 50, delay: 0.1 },
    { h: 20, delay: 0.2 },
    { h: 40, delay: 0.3 },
    { h: 60, delay: 0.4 },
  ];

  return (
    <div className={cn("flex h-full w-full items-end justify-center min-h-[200px] gap-2 pb-6", className)}>
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-6 rounded-t-sm bg-accent/40 relative overflow-hidden"
          initial={{ height: 10 }}
          animate={{ height: bar.h }}
          transition={{
            duration: 0.8,
            ease: "backInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: bar.delay,
          }}
        >
          {/* Brillo interno */}
          <motion.div
            className="absolute inset-0 bg-accent/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
              delay: bar.delay,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ------------------------------
// Loader para Gráficos de Dona/Pastel (Capital por Sucursal)
// ------------------------------
export function DonutChartLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center min-h-[200px]", className)}>
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100" className="text-warning opacity-60">
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="250"
            initial={{ strokeDashoffset: 250, rotate: -90 }}
            animate={{ strokeDashoffset: 50, rotate: 270 }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </svg>
        {/* Glow */}
        <div className="absolute inset-0 bg-warning/20 blur-2xl rounded-full" />
      </div>
    </div>
  );
}

// ------------------------------
// Loader para Gráficos de Aguja (Gauge / Ticket Promedio)
// ------------------------------
export function GaugeLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full w-full items-end justify-center min-h-[140px] pb-4", className)}>
      <div className="relative w-[140px] h-[70px] overflow-hidden">
        {/* Arco base */}
        <svg width="140" height="140" viewBox="0 0 100 100" className="absolute top-0 text-primary opacity-20">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="125 251" strokeDashoffset="125" strokeLinecap="round" transform="rotate(180 50 50)" />
        </svg>
        
        {/* Arco animado */}
        <svg width="140" height="140" viewBox="0 0 100 100" className="absolute top-0 text-primary opacity-80">
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray="125 251"
            strokeLinecap="round"
            transform="rotate(180 50 50)"
            initial={{ strokeDashoffset: 125 }}
            animate={{ strokeDashoffset: [125, 60, 100, 30, 80, 0] }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </svg>
        {/* Glow */}
        <div className="absolute bottom-0 w-[140px] h-10 bg-primary/20 blur-2xl rounded-t-full" />
      </div>
    </div>
  );
}

// ------------------------------
// Loader para Tablas (Leaderboard / Data Table)
// ------------------------------
export function TableLoader({ className }: { className?: string }) {
  const rows = [1, 2, 3, 4, 5];
  
  return (
    <div className={cn("flex flex-col gap-3 w-full p-4 min-h-[200px]", className)}>
      {/* Header skeleton */}
      <div className="flex gap-4 mb-2 pb-2 border-b border-border-soft/50">
        <div className="h-3 w-1/3 bg-surface-3 rounded-full opacity-50" />
        <div className="h-3 w-1/4 bg-surface-3 rounded-full opacity-50 ml-auto" />
        <div className="h-3 w-1/4 bg-surface-3 rounded-full opacity-50" />
      </div>
      
      {/* Rows skeletons */}
      {rows.map((row, i) => (
        <motion.div
          key={row}
          className="flex gap-4 items-center"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.1,
          }}
        >
          <div className="h-8 w-8 rounded-full bg-surface-3 shrink-0" />
          <div className="h-4 flex-1 bg-surface-3 rounded-md" />
          <div className="h-5 w-12 bg-surface-3 rounded-md shrink-0" />
          <div className="h-4 w-16 bg-surface-3 rounded-md shrink-0" />
        </motion.div>
      ))}
    </div>
  );
}

// ------------------------------
// Loader para Árboles (Jerarquía)
// ------------------------------
export function TreeLoader({ className }: { className?: string }) {
  const nodes = [
    { cx: 50, cy: 20 },
    { cx: 30, cy: 50 },
    { cx: 70, cy: 50 },
    { cx: 20, cy: 80 },
    { cx: 40, cy: 80 },
    { cx: 80, cy: 80 },
  ];
  
  const lines = [
    { x1: 50, y1: 20, x2: 30, y2: 50 },
    { x1: 50, y1: 20, x2: 70, y2: 50 },
    { x1: 30, y1: 50, x2: 20, y2: 80 },
    { x1: 30, y1: 50, x2: 40, y2: 80 },
    { x1: 70, y1: 50, x2: 80, y2: 80 },
  ];

  return (
    <div className={cn("flex h-full w-full items-center justify-center min-h-[150px] py-4", className)}>
      <svg width="100" height="100" viewBox="0 0 100 100" className="text-primary opacity-60">
        {lines.map((l, i) => (
          <motion.line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5"
            initial={{ opacity: 0.1, strokeDashoffset: 10 }}
            animate={{ opacity: 0.6, strokeDashoffset: 0 }}
            transition={{
              duration: 1,
              ease: "linear",
              repeat: Infinity,
            }}
          />
        ))}
        {nodes.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.cx}
            cy={n.cy}
            r="4"
            fill="currentColor"
            initial={{ scale: 0.8, opacity: 0.3 }}
            animate={{ scale: 1.5, opacity: 1 }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.2,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// ------------------------------
// Loader para Listas Simples
// ------------------------------
export function ListLoader({ className }: { className?: string }) {
  const rows = [1, 2, 3, 4];
  
  return (
    <div className={cn("flex flex-col gap-2 w-full p-2 min-h-[100px]", className)}>
      {rows.map((row, i) => (
        <motion.div
          key={row}
          className="h-7 w-full bg-surface-3 rounded-md overflow-hidden relative"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 0.7 }}
          transition={{
            duration: 1,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.15,
          }}
        >
          {/* Brillo interno */}
          <motion.div
            className="absolute inset-0 bg-primary/10"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.5,
              ease: "linear",
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
