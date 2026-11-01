"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { money, pct, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RankingItem } from "../hooks/useRentabilidad";
import { Search } from "lucide-react";

interface DetailTableProps {
  items: RankingItem[];
  level: string;
}

export function DetailTable({ items, level }: DetailTableProps) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lowerSearch = search.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(lowerSearch));
  }, [items, search]);

  const maxMargin = useMemo(() => {
    return Math.max(...items.map((i) => i.margen_pct || 0), 1);
  }, [items]);

  const columns = useMemo<Column<RankingItem>[]>(() => {
    const cols: Column<RankingItem>[] = [
      {
        header: "Nombre",
        key: "name",
        render: (row) => {
          const isHigh = row.margen_pct > 40;
          const isLow = row.margen_pct < 15;
          return (
            <div className="relative flex h-full items-center pl-3">
              {/* Highlight Line */}
              {isHigh && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md bg-emerald-500/80" />}
              {isLow && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md bg-rose-500/80" />}
              <span className="font-medium text-white">{row.name}</span>
            </div>
          );
        },
      },
    ];

    if (level !== "department") {
      cols.push({
        header: "Departamento",
        key: "parent_department",
        render: (row) => <span className="text-white/40">{row.parent_department}</span>,
      });
    }

    cols.push(
      {
        header: "Venta Neta",
        key: "venta_neta",
        align: "right",
        render: (row) => money(row.venta_neta),
      },
      {
        header: "Costo",
        key: "costo_total",
        align: "right",
        render: (row) => <span className="text-white/60">{money(row.costo_total)}</span>,
      },
      {
        header: "Margen S/",
        key: "margen_bruto",
        align: "right",
        render: (row) => (
          <span className={cn("font-medium", row.margen_bruto >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {money(row.margen_bruto)}
          </span>
        ),
      },
      {
        header: "Margen %",
        key: "margen_pct",
        align: "right",
        render: (row) => {
          const val = row.margen_pct;
          let badgeClass = "bg-rose-500/20 text-rose-400 border-rose-500/30";
          let barClass = "bg-rose-500";
          if (val >= 30) {
            badgeClass = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            barClass = "bg-emerald-500";
          }
          else if (val >= 15) {
            badgeClass = "bg-amber-500/20 text-amber-400 border-amber-500/30";
            barClass = "bg-amber-500";
          }

          const relativeWidth = Math.max(0, Math.min(100, (val / maxMargin) * 100));

          return (
            <div className="flex flex-col items-end gap-1.5">
              <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold shadow-sm", badgeClass)}>
                {pct(val)}
              </span>
              <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                <div className={cn("h-full rounded-full transition-all duration-500", barClass)} style={{ width: `${relativeWidth}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        header: "Contribución",
        key: "pct_contribucion_margen",
        align: "right",
        render: (row) => {
          const c = row.pct_contribucion_margen;
          return (
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-white/80">{pct(c)}</span>
              <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(c, 100)}%` }} />
              </div>
            </div>
          )
        },
      },
      {
        header: "Unidades",
        key: "unidades_vendidas",
        align: "right",
        render: (row) => num(row.unidades_vendidas),
      },
      {
        header: "Margen/Unidad",
        key: "margen_por_unidad",
        align: "right",
        render: (row) => <span className="text-white/80">{money(row.margen_por_unidad)}</span>,
      }
    );

    return cols;
  }, [level, maxMargin]);

  const levelName = level === "department" ? "Departamento" : level === "category" ? "Categoría" : "Subcategoría";

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-white">Detalle por {levelName}</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-64 rounded-lg border border-white/10 bg-black/20 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>
      </div>
      
      <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
        <DataTable
          columns={columns}
          rows={filteredItems}
          rowKey={(row, i) => row.name + String(i)}
          zebra
        />
      </div>
    </div>
  );
}
