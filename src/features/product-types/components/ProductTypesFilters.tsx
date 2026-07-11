"use client";

import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TOGGLES, type Toggle } from "../lib";

export function ProductTypesFilters({
  search,
  setSearch,
  toggle,
  setToggle,
}: {
  search: string;
  setSearch: (v: string) => void;
  toggle: Toggle;
  setToggle: (v: Toggle) => void;
}) {
  return (
    <Card className="mb-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full pl-8"
          />
        </div>
        <div className="flex gap-1.5">
          {TOGGLES.map((t) => (
            <button
              key={t.key}
              onClick={() => setToggle(t.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                toggle === t.key
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
