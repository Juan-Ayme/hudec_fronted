import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingPaginationProps {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
  className?: string;
}

export function FloatingPagination({ total, limit, offset, onChange, className }: FloatingPaginationProps) {
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  if (total <= limit) return null; // Solo muestra si hay más de una página

  return (
    <div className={cn(
      "sticky bottom-6 z-20 mx-auto w-max bg-surface-2/60 backdrop-blur-[32px] border border-white/10 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-full px-1.5 py-1 animate-[fade-in-up_0.6s_cubic-bezier(0.16,1,0.3,1)] transition-all duration-300 ease-out hover:scale-105 hover:bg-surface-2/80 hover:shadow-[0_20px_50px_-8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.2)]",
      className
    )}>
      <div className="flex items-center gap-0.5 px-0.5">
        <button
          disabled={!canPrev}
          onClick={() => onChange(0)}
          className={cn(
            "p-1.5 rounded-full text-muted hover:text-fg hover:bg-white/10 active:scale-[0.97] transition-all duration-300 ease-out",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100"
          )}
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          disabled={!canPrev}
          onClick={() => onChange(Math.max(0, offset - limit))}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-muted text-sm font-medium hover:text-fg hover:bg-white/10 active:scale-[0.97] transition-all duration-300 ease-out",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        
        <div className="flex items-center mx-0.5">
          <div className="w-px h-3.5 bg-white/10" />
          <div className="px-2.5 flex items-center gap-1">
            <span className="text-sm font-semibold text-fg">{Math.floor(offset / limit) + 1}</span>
            <span className="text-xs text-faint">de</span>
            <span className="text-sm font-medium text-muted">{Math.ceil(total / limit) || 1}</span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
        </div>

        <button
          disabled={!canNext}
          onClick={() => onChange(offset + limit)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-muted text-sm font-medium hover:text-fg hover:bg-white/10 active:scale-[0.97] transition-all duration-300 ease-out",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100"
          )}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          disabled={!canNext}
          onClick={() => onChange(Math.max(0, Math.floor((total - 1) / limit) * limit))}
          className={cn(
            "p-1.5 rounded-full text-muted hover:text-fg hover:bg-white/10 active:scale-[0.97] transition-all duration-300 ease-out",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100"
          )}
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
