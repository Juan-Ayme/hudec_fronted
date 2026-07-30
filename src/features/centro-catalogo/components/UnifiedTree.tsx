"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FolderOpen,
  Layers,
  Search,
  Send,
  Sparkles,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { money, num, pct } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/card";
import { ProgressBar, DEPT_COLORS } from "@/features/ventas-jerarquicas/components/ProgressBar";
import { HealthBadge } from "@/features/ventas-jerarquicas/components/HealthBadge";
import { ROOT_SELECTION, type Selection } from "@/lib/types";
import type { UnifiedNode } from "../types";
import { DeptGridView } from "./DeptGridView";

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

/** Computa el set de nombres de nodos del árbol que coinciden con la búsqueda. */
function computeSearchMatches(tree: UnifiedNode[], query: string): Set<string> {
  const matches = new Set<string>();
  if (!query || query.length < 2) return matches;
  const q = query.toLowerCase();

  for (const dept of tree) {
    if (dept.name.toLowerCase().includes(q)) matches.add(dept.name);
    for (const cat of dept.children) {
      if (cat.name.toLowerCase().includes(q)) matches.add(cat.name);
      for (const subcat of cat.children) {
        if (subcat.name.toLowerCase().includes(q)) matches.add(subcat.name);
      }
    }
  }
  return matches;
}

/** Badges del universo de compras: críticos+altas (rojo) y solicitados (ámbar). */
function ComprasBadges({ node }: { node: UnifiedNode }) {
  const pendientes = node.criticos + node.altas;
  return (
    <>
      {pendientes > 0 && (
        <span
          title={`${node.criticos} crítico(s) · ${node.altas} alta(s) por reponer`}
          className="inline-flex shrink-0 items-center rounded-full bg-danger/15 px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums text-danger"
        >
          {num(pendientes)}
        </span>
      )}
      {node.solicitados > 0 && (
        <span
          title={`${node.solicitados} solicitado(s) por tienda`}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums text-warning"
        >
          <Send className="h-2.5 w-2.5" />
          {node.solicitados}
        </span>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mejora 2: Menú Desplegable (Dropdown) de Departamentos
   ═══════════════════════════════════════════════════════════════════════════ */

function DeptDropdown({
  tree,
  selection,
  onSelect,
}: {
  tree: UnifiedNode[];
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (tree.length === 0) return null;
  const currentDept = tree.find((d) => d.name === selection.dept);

  return (
    <div className="relative mb-2 z-20" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-surface-2/60 px-3 py-2 text-left text-[0.8rem] transition-colors hover:bg-surface-2 hover:border-white/20 active:scale-[0.98]"
      >
        <span className="flex items-center gap-2">
          <FolderOpen className={cn("h-4 w-4", currentDept ? "text-primary" : "text-faint")} />
          <span className={currentDept ? "text-fg font-semibold" : "text-muted"}>
            {currentDept ? currentDept.name : "Ir a departamento..."}
          </span>
        </span>
        <ChevronRight className={cn("h-4 w-4 text-faint transition-transform duration-300", open && "rotate-90")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-surface/95 backdrop-blur-xl p-1 shadow-2xl custom-scrollbar animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => {
              onSelect(ROOT_SELECTION);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[0.75rem] transition-colors",
              !selection.dept ? "bg-primary/20 text-primary font-semibold" : "text-fg hover:bg-white/5",
            )}
          >
            <span className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 opacity-70" /> Todos los productos
            </span>
          </button>
          
          <div className="my-1 h-px bg-white/5 mx-2" />

          {tree.map((dept, i) => {
            const tone = DEPT_COLORS[i % DEPT_COLORS.length];
            const isSelected = selection.dept === dept.name;
            const pendientes = dept.criticos + dept.altas;

            return (
              <button
                key={dept.name}
                onClick={() => {
                  onSelect({ dept: dept.name, cat: null, subcat: null });
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[0.75rem] transition-colors mt-0.5",
                  isSelected ? "bg-white/10 text-fg font-semibold" : "text-muted hover:bg-white/5 hover:text-fg",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", tone.dot)} />
                  <span className="truncate text-left max-w-[200px]">{dept.name}</span>
                </div>
                {pendientes > 0 && (
                  <span className="rounded-full bg-danger/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-danger">
                    {pendientes}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TreeSummaryCard (sin cambios conceptuales)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Tarjeta resumen sobre el árbol (port de la de /ventas-jerarquicas). */
export function TreeSummaryCard({
  tree,
  scopeLabel,
}: {
  tree: UnifiedNode[];
  scopeLabel: string;
}) {
  const totalGeneral = tree.reduce((a, d) => a + d.ventas, 0);
  const top5 = tree.slice(0, 5);
  return (
    <Card className="bg-surface/30 backdrop-blur-xl border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <CardBody className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">Centro de Catálogo</p>
            <p className="text-[0.6rem] text-faint">90 días · {scopeLabel}</p>
          </div>
          <p className="shrink-0 font-mono text-h3 font-semibold tabular-nums tracking-tight text-fg">
            {money(totalGeneral)}
          </p>
        </div>
        <div className="mt-3 flex gap-0.5 overflow-hidden rounded-full h-1.5 opacity-0 animate-[fade-in-up_var(--duration-slow)_var(--ease-premium)_both]">
          {top5.map((d, i) => {
            const colors = ["bg-primary", "bg-info", "bg-violet", "bg-success", "bg-warning"];
            return (
              <div key={d.name} className={cn("h-full transition-all duration-[var(--duration-slow)]", colors[i])} style={{ width: `${d.pct * 100}%` }} title={`${d.name}: ${pct(d.pct * 100)}`} />
            );
          })}
          <div className="h-full bg-surface-3" style={{ width: `${Math.max(0, (1 - top5.reduce((a, d) => a + d.pct, 0)) * 100)}%` }} />
        </div>
      </CardBody>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   UnifiedTree — árbol con las 5 mejoras UX
   ═══════════════════════════════════════════════════════════════════════════ */

export function UnifiedTree({
  tree,
  selection,
  onSelect,
  search,
  totalSkus,
  hasMatrix,
}: {
  tree: UnifiedNode[];
  selection: Selection;
  onSelect: (s: Selection) => void;
  /** Búsqueda global — con ≥2 caracteres se expanden los nodos visibles. */
  search: string;
  totalSkus: number;
  /** false en modo viewer (sin matriz): oculta HealthBadge de kanban. */
  hasMatrix: boolean;
}) {
  const [expandedDeptos, setExpandedDeptos] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const firstMatchRef = useRef<HTMLDivElement>(null);

  /* ── Mejora 1: Búsqueda con highlight ────────────────────────────────── */
  const isSearching = search.length >= 2;
  const searchMatches = useMemo(() => computeSearchMatches(tree, search), [tree, search]);
  const matchCount = searchMatches.size;

  // Ajustes de expansión durante el render (patrón "adjust state on prop
  // change" — sin efectos, evita renders en cascada).

  // Búsqueda ≥2 caracteres: expandir todos los nodos visibles.
  const [prevSearchTree, setPrevSearchTree] = useState<{ search: string; tree: UnifiedNode[] } | null>(null);
  if (!prevSearchTree || prevSearchTree.search !== search || prevSearchTree.tree !== tree) {
    setPrevSearchTree({ search, tree });
    if (search && search.length >= 2) {
      setExpandedDeptos((prev) => {
        const next = new Set(prev);
        tree.forEach((d) => next.add(d.name));
        return next;
      });
      setExpandedCats((prev) => {
        const next = new Set(prev);
        tree.forEach((d) => {
          d.children.forEach((c) => next.add(`${d.name}::${c.name}`));
        });
        return next;
      });
    }
  }

  // Auto-scroll al primer match cuando cambia la búsqueda
  useEffect(() => {
    if (isSearching && matchCount > 0 && firstMatchRef.current) {
      firstMatchRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSearching, matchCount, search]);

  // Auto-scroll al departamento cuando se selecciona (ej: desde el Dropdown)
  const prevDeptRef = useRef<string | null>(selection.dept);
  useEffect(() => {
    if (selection.dept && selection.dept !== prevDeptRef.current) {
      // Usamos CSS.escape por si el nombre tiene caracteres raros
      const el = document.getElementById(`dept-node-${selection.dept}`);
      if (el) {
        // Timeout muy corto para permitir que React renderice la expansión primero
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
    prevDeptRef.current = selection.dept;
  }, [selection.dept]);

  // Selección externa (deep link, breadcrumb, salto cruzado): expandir ancestros.
  const [prevSelection, setPrevSelection] = useState<Selection | null>(null);
  if (prevSelection !== selection) {
    setPrevSelection(selection);
    if (selection.dept) {
      const dept = selection.dept;
      setExpandedDeptos((prev) => (prev.has(dept) ? prev : new Set(prev).add(dept)));
      if (selection.cat) {
        const key = `${dept}::${selection.cat}`;
        setExpandedCats((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
      }
    }
  }

  /* ── Mejora 5: Controles colapsar/expandir ───────────────────────────── */
  const collapseAll = useCallback(() => {
    setExpandedDeptos(new Set());
    setExpandedCats(new Set());
  }, []);

  const expandAll = useCallback(() => {
    setExpandedDeptos(new Set(tree.map((d) => d.name)));
    setExpandedCats(new Set(
      tree.flatMap((d) => d.children.map((c) => `${d.name}::${c.name}`)),
    ));
  }, [tree]);

  const toggleDepto = (name: string) => {
    setExpandedDeptos((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleCat = (deptName: string, catName: string) => {
    const key = `${deptName}::${catName}`;
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectDepto = (name: string) => {
    if (selection.dept === name) {
      onSelect(ROOT_SELECTION);
    } else {
      onSelect({ dept: name, cat: null, subcat: null });
      setExpandedDeptos((prev) => new Set(prev).add(name));
    }
  };

  const selectCat = (deptName: string, catName: string) => {
    if (selection.dept === deptName && selection.cat === catName) {
      onSelect({ dept: deptName, cat: null, subcat: null });
    } else {
      onSelect({ dept: deptName, cat: catName, subcat: null });
      setExpandedDeptos((prev) => new Set(prev).add(deptName));
      setExpandedCats((prev) => new Set(prev).add(`${deptName}::${catName}`));
    }
  };

  const selectSubcat = (deptName: string, catName: string, subcatName: string) => {
    if (selection.dept === deptName && selection.cat === catName && selection.subcat === subcatName) {
      onSelect({ dept: deptName, cat: catName, subcat: null });
    } else {
      onSelect({ dept: deptName, cat: catName, subcat: subcatName });
    }
  };

  const isRootSel = !selection.dept && !selection.cat && !selection.subcat;

  // Track whether this is the first match we've rendered (for auto-scroll ref)
  let firstMatchAssigned = false;
  const getFirstMatchRef = (nodeName: string) => {
    if (isSearching && searchMatches.has(nodeName) && !firstMatchAssigned) {
      firstMatchAssigned = true;
      return firstMatchRef;
    }
    return undefined;
  };

  /* ── Mejora 4: Vista Grid en root ──────────────────────────────────── */
  const showGrid = isRootSel && !isSearching && tree.length > 0;

  return (
    <div>
      {/* ── Mejora 2: Menú Desplegable (Dropdown) ────────────────────── */}
      <DeptDropdown
        tree={tree}
        selection={selection}
        onSelect={(s) => {
          onSelect(s);
          if (s.dept) setExpandedDeptos((prev) => new Set(prev).add(s.dept!));
        }}
      />

      {/* ── Mejora 1: Counter de resultados de búsqueda ──────────────── */}
      {isSearching && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-warning/5 border border-warning/10 px-2.5 py-1.5">
          <Search className="h-3 w-3 text-warning" />
          <span className="text-[0.65rem] text-warning font-medium">
            {matchCount > 0
              ? `${matchCount} resultado${matchCount !== 1 ? "s" : ""} para «${search}»`
              : `Sin resultados para «${search}»`}
          </span>
        </div>
      )}

      {/* ── Mejora 4: Vista Grid en root ──────────────────────────────────── */}
      {!isSearching && isRootSel ? (
        <div className="mt-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <DeptGridView
            tree={tree}
            onSelect={(s) => {
              onSelect(s);
              if (s.dept) setExpandedDeptos((prev) => new Set(prev).add(s.dept!));
            }}
            hasMatrix={hasMatrix}
          />
        </div>
      ) : tree.length === 0 ? (
        <p className="py-4 text-center text-xs text-faint">Sin datos para mostrar</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1 pr-1 animate-in fade-in slide-in-from-left-2 duration-300">
          {tree.map((dept, deptIdx) => {
            const isDeptSel = selection.dept === dept.name;
            const isDeptExpanded = expandedDeptos.has(dept.name);
            const deptTone = DEPT_COLORS[deptIdx % DEPT_COLORS.length];
            const isDeptMatch = isSearching && searchMatches.has(dept.name);
            const ref = getFirstMatchRef(dept.name);

            // En modo Drill-Down (sin búsqueda y con departamento seleccionado),
            // ignoramos todos los departamentos excepto el seleccionado.
            const isDrillDown = !isSearching && selection.dept !== null;
            if (isDrillDown && !isDeptSel) return null;

            const renderCategories = () => (
              <ul className={cn("flex flex-col gap-0.5", !isDrillDown && "ml-3.5 mt-1 mb-2 animate-tree-expand overflow-hidden border-l border-white/10 pl-2")}>
                {dept.children.map((cat, catIdx) => {
                  const catKey = `${dept.name}::${cat.name}`;
                  const isCatSel = selection.cat === cat.name;
                  const isCatExpanded = expandedCats.has(catKey);
                  const isCatMatch = isSearching && searchMatches.has(cat.name);
                  const catRef = getFirstMatchRef(cat.name);

                  return (
                    <li key={cat.name} id={`cat-node-${cat.name}`}>
                      <div
                        ref={catRef}
                        className={cn(
                          "group flex w-full items-start gap-0.5 rounded-lg transition-all border border-transparent",
                          "duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                          isCatSel && !selection.subcat
                            ? `${deptTone.bgActive} border-white/10 shadow-sm`
                            : "hover:bg-surface-2/50",
                          // Mejora 1: highlight
                          isCatMatch && "ring-1 ring-warning/40 bg-warning/[0.07]",
                          isSearching && !isCatMatch && "opacity-40",
                          // Sticky para la categoría si está expandida
                          isCatExpanded && "sticky top-0 z-10 bg-surface/95 backdrop-blur-sm shadow-sm"
                        )}
                      >
                        <button onClick={() => toggleCat(dept.name, cat.name)} className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-3 hover:text-muted active:scale-[0.95]">
                          <ChevronRight className={cn("h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]", isCatExpanded && "rotate-90")} />
                        </button>
                        <button onClick={() => selectCat(dept.name, cat.name)} className="relative flex min-w-0 flex-1 flex-col justify-center py-2.5 pr-3 text-left active:scale-[0.98] transition-transform">
                          <div className="flex items-center justify-between gap-2 w-full mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <FolderOpen className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isCatSel ? deptTone.dot.replace('bg-', 'text-') : "text-faint")} />
                              <p className={cn("truncate text-[0.75rem] transition-colors", isCatSel ? "text-fg font-bold" : "text-fg/90 font-medium")}>{cat.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasMatrix && <HealthBadge paraComprar={cat.paraComprar} saludables={cat.saludables} compact />}
                              <ComprasBadges node={cat} />
                              <p className="font-mono text-[0.75rem] tabular-nums font-semibold text-fg/90 shrink-0">{money(cat.ventas)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full pl-5.5 mb-1 pr-1">
                            <ProgressBar pct={cat.pct} tone={deptTone.bar} />
                            <div className="flex items-center gap-1.5 text-[0.6rem] text-faint shrink-0 tabular-nums">
                              <span>{pct(cat.pct * 100)}</span><span>•</span><span>{num(cat.skuCount)} SKUs</span>
                            </div>
                          </div>
                        </button>
                      </div>

                      {isCatExpanded && cat.children.length > 0 && (
                        <ul className="ml-3.5 mt-0.5 mb-1.5 animate-tree-expand overflow-hidden border-l border-white/10 pl-2 flex flex-col gap-0.5">
                          {cat.children.map((subcat) => {
                            const isSubcatSel = isCatSel && selection.subcat === subcat.name;
                            const isSubcatMatch = isSearching && searchMatches.has(subcat.name);
                            const subcatRef = getFirstMatchRef(subcat.name);

                            return (
                              <li key={subcat.name}>
                                <button
                                  ref={subcatRef as React.Ref<HTMLButtonElement> | undefined}
                                  onClick={() => selectSubcat(dept.name, cat.name, subcat.name)}
                                  className={cn(
                                    "group relative flex w-full flex-col justify-center py-2 pl-3 pr-3 text-left transition-all rounded-md",
                                    "duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
                                    isSubcatSel
                                      ? "bg-white/5 border border-white/5 shadow-sm"
                                      : "hover:bg-surface-2/40 border border-transparent",
                                    // Mejora 1: highlight
                                    isSubcatMatch && "ring-1 ring-warning/40 bg-warning/[0.07]",
                                    isSearching && !isSubcatMatch && "opacity-40",
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2 w-full mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Tag className={cn("h-3 w-3 shrink-0 transition-colors", isSubcatSel ? "text-white/80" : "text-faint")} />
                                      <p className={cn("truncate text-[0.7rem] transition-colors", isSubcatSel ? "text-fg font-semibold" : "text-fg/80")}>{subcat.name}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {hasMatrix && <HealthBadge paraComprar={subcat.paraComprar} saludables={subcat.saludables} compact />}
                                      <ComprasBadges node={subcat} />
                                      <p className="font-mono text-[0.7rem] tabular-nums font-semibold text-fg/90 shrink-0">{money(subcat.ventas)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 w-full pl-5 pr-1">
                                    <ProgressBar pct={subcat.pct} tone="info" />
                                    <div className="flex items-center gap-1.5 text-[0.55rem] text-faint shrink-0 tabular-nums">
                                      <span>{pct(subcat.pct * 100)}</span><span>•</span><span>{num(subcat.skuCount)} SKUs</span>
                                    </div>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            );

            // Si estamos en Drill-Down, NO renderizamos el header del departamento, solo sus categorías.
            if (isDrillDown) {
              return <li key={dept.name}>{renderCategories()}</li>;
            }

            // Si estamos en Búsqueda Global (o en algún caso futuro donde se requiera ver el árbol completo),
            // renderizamos el header del departamento y luego sus categorías.
            return (
              <li key={dept.name} id={`dept-node-${dept.name}`}>
                <div
                  ref={ref}
                  className={cn(
                    "group flex w-full items-start gap-0.5 rounded-xl transition-all border border-transparent",
                    "duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    isDeptSel && !selection.cat
                      ? `${deptTone.bgActive} border-white/10 shadow-sm`
                      : "hover:bg-surface-2/50",
                    isDeptMatch && "ring-1 ring-warning/40 bg-warning/[0.07]",
                    isSearching && !isDeptMatch && "opacity-40",
                    isDeptExpanded && "sticky top-0 z-10 bg-surface/95 backdrop-blur-sm"
                  )}
                >
                  <button onClick={() => toggleDepto(dept.name)} className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-faint transition-all hover:bg-surface-3 hover:text-muted active:scale-[0.95]">
                    <ChevronRight className={cn("h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]", isDeptExpanded && "rotate-90")} />
                  </button>

                  <button onClick={() => selectDepto(dept.name)} className="relative flex min-w-0 flex-1 flex-col justify-center py-2.5 pr-3 text-left overflow-hidden active:scale-[0.98] transition-transform">
                    <div className="flex items-center justify-between gap-3 w-full mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full shadow-sm", deptTone.dot)} />
                        <p className="truncate text-[0.8rem] font-semibold text-fg/90">{dept.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasMatrix && <HealthBadge paraComprar={dept.paraComprar} saludables={dept.saludables} compact={!isDeptSel} />}
                        <ComprasBadges node={dept} />
                        <p className="font-mono text-[0.75rem] tabular-nums font-bold text-fg shrink-0">{money(dept.ventas)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full pl-4.5 mt-0.5 mb-1 pr-1">
                      <ProgressBar pct={dept.pct} tone={deptTone.bar} />
                      <div className="flex items-center gap-1.5 text-[0.65rem] text-faint shrink-0 tabular-nums">
                        <span>{pct(dept.pct * 100)}</span><span>•</span><span>{num(dept.skuCount)} SKUs</span>
                      </div>
                    </div>
                  </button>
                </div>

                {isDeptExpanded && dept.children.length > 0 && renderCategories()}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
