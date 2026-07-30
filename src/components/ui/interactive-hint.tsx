"use client";

import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveHintProps {
  text?: string;
  className?: string;
  onClick?: () => void;
}

export function InteractiveHint({
  text = "Haz clic en cualquier pico o día para ver productos y quiebres",
  className,
  onClick,
}: InteractiveHintProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        "bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15",
        "border border-primary/30 shadow-[0_2px_12px_rgba(59,130,246,0.15)]",
        "text-fg/95 backdrop-blur-md transition-all duration-300",
        "hover:border-primary/50 hover:bg-primary/25 hover:shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:scale-[1.02]",
        onClick ? "cursor-pointer active:scale-[0.98]" : "cursor-default",
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <MousePointerClick className="h-3.5 w-3.5 text-primary shrink-0" />
      <span className="tracking-tight leading-none text-[11px] sm:text-xs font-normal">
        {text}
      </span>
    </div>
  );
}
