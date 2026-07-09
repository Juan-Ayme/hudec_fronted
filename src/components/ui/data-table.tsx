import { cn } from "@/lib/utils";
import { LoadingState, ErrorState, EmptyState } from "./states";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  isLoading?: boolean;
  error?: unknown;
  emptyTitle?: string;
  emptyHint?: string;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T, i: number) => string | number;
  maxHeight?: string;
  /** Filas con fondo alterno (subtleza). Default: false. */
  zebra?: boolean;
}

const alignClass = {
  left: "text-left",
  right: "text-right tabular-nums",
  center: "text-center",
};

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  error,
  emptyTitle,
  emptyHint,
  onRowClick,
  rowKey,
  maxHeight,
  zebra = false,
}: DataTableProps<T>) {
  if (error) return <ErrorState error={error} />;
  if (isLoading && !rows) return <LoadingState />;
  if (rows && rows.length === 0)
    return <EmptyState title={emptyTitle} hint={emptyHint} />;

  return (
    <div
      className="relative overflow-auto rounded-xl border border-border-soft bg-surface shadow-card"
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="w-full border-collapse text-body">
        <thead className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur-sm">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "border-b border-border-soft px-3 py-2.5 text-caption font-semibold uppercase tracking-[0.06em] text-muted whitespace-nowrap",
                  alignClass[c.align ?? "left"],
                  c.headerClassName,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((row, i) => (
            <tr
              key={rowKey ? rowKey(row, i) : i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-border-soft/60 last:border-0",
                "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-premium)]",
                zebra && i % 2 === 1 && "bg-surface-2/35",
                onRowClick && "cursor-pointer hover:bg-surface-3/50",
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 text-fg/90",
                    alignClass[c.align ?? "left"],
                    c.className,
                  )}
                >
                  {c.render
                    ? c.render(row, i)
                    : String((row as Record<string, unknown>)[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {isLoading && rows && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/40 backdrop-blur-[1px]">
          <LoadingState />
        </div>
      )}
    </div>
  );
}

export function Pagination({
  total,
  limit,
  offset,
  onChange,
}: {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
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
  );
}
