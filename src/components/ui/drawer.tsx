"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      className="fixed inset-0 z-50"
    >
      <div
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm animate-[fade-in_var(--duration-base)_var(--ease-premium)_both]"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col border-l border-border-soft bg-bg-soft shadow-modal",
          "animate-[slide-in-from-right_var(--duration-slow)_var(--ease-premium)_both]",
          width,
        )}
      >
        {(title || subtitle) ? (
          <div className="flex items-start justify-between gap-3 border-b border-border-soft px-5 py-4">
            <div className="min-w-0">
              {title && (
                <h3 id={titleId} className="truncate text-h3 font-semibold text-fg">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 truncate text-caption text-muted">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-premium)] hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-surface-3/60 backdrop-blur-md text-muted transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-3 hover:text-fg active:scale-[0.90] border border-white/5 shadow-sm"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <div className={cn("flex-1 overflow-y-auto px-5", (title || subtitle) ? "py-5" : "pt-8 pb-5")}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
