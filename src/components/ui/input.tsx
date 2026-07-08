import { cn } from "@/lib/utils";

const base = cn(
  "h-10 rounded-xl border border-border/40 bg-surface-2/40 backdrop-blur-sm px-3.5 text-body text-fg shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]",
  "placeholder:text-faint",
  "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
  "focus:border-primary/50 focus:bg-surface-2/60 focus:outline-none focus:ring-4 focus:ring-primary/20",
  "aria-[invalid=true]:border-danger/70 aria-[invalid=true]:focus:ring-danger/25",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(base, "pr-8 cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  /** Texto de ayuda debajo del input (descripción, mensaje de validación). */
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="text-caption text-faint">{hint}</span>}
    </label>
  );
}
