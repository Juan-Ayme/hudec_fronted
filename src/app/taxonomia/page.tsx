"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronRight,
  Download,
  Eraser,
  Folder,
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Tag,
  Upload,
  Search,
} from "lucide-react";
import {
  getTaxonomyTree,
  createDepartment,
  renameDepartment,
  deleteDepartment,
  createCategory,
  renameCategory,
  deleteCategory,
  createSubcategory,
  renameSubcategory,
  deleteSubcategory,
  bootstrapTaxonomy,
  exportTaxonomy,
  wipeTaxonomy,
  type TaxonomyDict,
  type WipeTaxonomyStats,
} from "@/lib/api";
import { useCompany } from "@/components/company-context";
import { num } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils";

type Level = "department" | "category" | "subcategory";

interface FormState {
  mode: "create" | "rename";
  level: Level;
  parentId?: number;
  id?: number;
  currentName?: string;
}

interface DeleteState {
  level: Level;
  id: number;
  name: string;
  childCount: number;
}

const LEVEL_LABEL: Record<Level, string> = {
  department: "departamento",
  category: "categoría",
  subcategory: "subcategoría",
};

export default function TaxonomiaPage() {
  const qc = useQueryClient();
  const tree = useQuery({
    queryKey: ["taxonomy-tree"],
    queryFn: ({ signal }) => getTaxonomyTree(signal),
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [del, setDel] = useState<DeleteState | null>(null);
  const [force, setForce] = useState(false);

  // Import / Export
  const { activeCompany } = useCompany();
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{
    ok: boolean;
    message: string;
    stats?: { departments_inserted: number; categories_inserted: number; subcategories_inserted: number };
  } | null>(null);

  // Limpiar todo
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeConfirm, setWipeConfirm] = useState("");
  const [wipeResult, setWipeResult] = useState<{
    ok: boolean;
    message: string;
    stats?: WipeTaxonomyStats;
    warnings?: string[];
  } | null>(null);

  const wipeMut = useMutation({
    mutationFn: wipeTaxonomy,
    onSuccess: (data) => {
      setWipeResult({
        ok: true,
        message: "Taxonomía eliminada.",
        stats: data.stats,
        warnings: data.report?.warnings ?? [],
      });
      qc.invalidateQueries({ queryKey: ["taxonomy-tree"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      qc.invalidateQueries({ queryKey: ["subcategories-all"] });
    },
    onError: (err: Error) => {
      setWipeResult({ ok: false, message: err.message });
    },
  });

  const importMut = useMutation({
    mutationFn: async () => {
      let parsed: TaxonomyDict;
      try {
        parsed = JSON.parse(importText);
      } catch (e) {
        throw new Error("JSON inválido: " + (e as Error).message);
      }
      // Puede venir como { taxonomy: {...} } (formato del export) o directamente {...}
      const dict = (parsed as unknown as { taxonomy?: TaxonomyDict }).taxonomy ?? parsed;
      return bootstrapTaxonomy(dict);
    },
    onSuccess: (data) => {
      setImportResult({
        ok: true,
        message: "Taxonomía importada correctamente.",
        stats: data.stats,
      });
      qc.invalidateQueries({ queryKey: ["taxonomy-tree"] });
    },
    onError: (err: Error) => {
      setImportResult({ ok: false, message: err.message });
    },
  });

  const handleExport = async () => {
    try {
      const data = await exportTaxonomy();
      const blob = new Blob(
        [JSON.stringify(data.taxonomy, null, 2)],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = activeCompany?.slug ?? "taxonomia";
      a.download = `${slug}-taxonomia.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error al exportar: " + (e as Error).message);
    }
  };

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["taxonomy-tree"] });
    qc.invalidateQueries({ queryKey: ["departments"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["subcategories"] });
    qc.invalidateQueries({ queryKey: ["subcategories-all"] });
  };

  const formMut = useMutation({
    mutationFn: async () => {
      const name = nameInput.trim();
      if (!form) return;
      if (form.mode === "create") {
        if (form.level === "department") return createDepartment(name);
        if (form.level === "category")
          return createCategory(form.parentId as number, name);
        return createSubcategory(form.parentId as number, name);
      }
      if (form.level === "department")
        return renameDepartment(form.id as number, name);
      if (form.level === "category")
        return renameCategory(form.id as number, name);
      return renameSubcategory(form.id as number, name);
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
      setNameInput("");
    },
  });

  const delMut = useMutation({
    mutationFn: async () => {
      if (!del) return;
      if (del.level === "department") return deleteDepartment(del.id, force);
      if (del.level === "category") return deleteCategory(del.id, force);
      return deleteSubcategory(del.id, force);
    },
    onSuccess: () => {
      invalidate();
      setDel(null);
      setForce(false);
    },
  });

  const openCreate = (level: Level, parentId?: number) => {
    setForm({ mode: "create", level, parentId });
    setNameInput("");
    formMut.reset();
  };
  const openRename = (level: Level, id: number, currentName: string) => {
    setForm({ mode: "rename", level, id, currentName });
    setNameInput(currentName);
    formMut.reset();
  };
  const openDelete = (d: DeleteState) => {
    setDel(d);
    setForce(false);
    delMut.reset();
  };

  const departments = useMemo(() => {
    const arbol = tree.data?.arbol ?? {};
    return Object.entries(arbol).sort(([a], [b]) => a.localeCompare(b));
  }, [tree.data]);

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase();

    return departments
      .map(([depName, dep]) => {
        const depMatch = depName.toLowerCase().includes(q);
        
        const filteredCategories = Object.entries(dep.categorias)
          .map(([catName, cat]) => {
            const catMatch = catName.toLowerCase().includes(q);
            const filteredSubs = cat.subcategorias.filter((sub) =>
              sub.nombre.toLowerCase().includes(q),
            );

            if (depMatch || catMatch || filteredSubs.length > 0) {
              return [
                catName,
                {
                  ...cat,
                  subcategorias: (depMatch || catMatch) ? cat.subcategorias : filteredSubs,
                },
              ] as const;
            }
            return null;
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);

        if (depMatch || filteredCategories.length > 0) {
          return [
            depName,
            {
              ...dep,
              categorias: Object.fromEntries(filteredCategories),
            },
          ] as const;
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [departments, searchQuery]);

  const stats = useMemo(() => {
    let cats = 0;
    let subs = 0;
    let prods = 0;
    for (const [, dep] of departments) {
      const cs = Object.values(dep.categorias);
      cats += cs.length;
      for (const c of cs) {
        subs += c.subcategorias.length;
        prods += c.subcategorias.reduce((s, x) => s + (x.productos || 0), 0);
      }
    }
    return { deps: departments.length, cats, subs, prods };
  }, [departments]);

  const ActionBtn = ({
    icon: Icon,
    onClick,
    title,
    danger,
  }: {
    icon: typeof Plus;
    onClick: () => void;
    title: string;
    danger?: boolean;
  }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={cn(
        "rounded-md p-1 text-faint opacity-0 transition-opacity group-hover:opacity-100",
        danger ? "hover:bg-danger/15 hover:text-danger" : "hover:bg-surface-3 hover:text-fg",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Taxonomía"
        description="Jerarquía interna Departamento → Categoría → Subcategoría. Vive solo en tu base de datos (no en BSale)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={handleExport} title="Descargar el árbol actual como JSON">
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setImportText("");
                setImportResult(null);
                setImportOpen(true);
              }}
              title="Pegar un JSON e importar los deptos/categorías/subcategorías que falten"
            >
              <Upload className="h-4 w-4" /> Importar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setWipeConfirm("");
                setWipeResult(null);
                setWipeOpen(true);
                wipeMut.reset();
              }}
              disabled={stats.deps === 0}
              title="Borrar TODA la taxonomía y empezar desde cero"
            >
              <Eraser className="h-4 w-4" /> Limpiar todo
            </Button>
            <Button onClick={() => openCreate("department")}>
              <Plus className="h-4 w-4" /> Departamento
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Badge tone="primary">{num(stats.deps)} departamentos</Badge>
        <Badge tone="info">{num(stats.cats)} categorías</Badge>
        <Badge tone="violet">{num(stats.subs)} subcategorías</Badge>
        <Badge tone="neutral">{num(stats.prods)} productos clasificados</Badge>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
        <Input
          placeholder="Buscar departamento, categoría o subcategoría..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full"
        />
      </div>

      <Card className="p-2">
        {tree.isLoading ? (
          <LoadingState />
        ) : tree.error ? (
          <ErrorState error={tree.error} />
        ) : departments.length === 0 ? (
          <EmptyState
            title="Taxonomía vacía"
            hint="Crea el primer departamento para empezar."
          />
        ) : filteredDepartments.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            hint={`No se encontró nada para "${searchQuery}".`}
          />
        ) : (
          <ul className="divide-y divide-border/50">
            {filteredDepartments.map(([depName, dep]) => {
              const depKey = `d-${dep.id}`;
              const depOpen = searchQuery ? true : expanded.has(depKey);
              const cats = Object.entries(dep.categorias).sort(([a], [b]) =>
                a.localeCompare(b),
              );
              const depProds = cats.reduce(
                (s, [, c]) =>
                  s + c.subcategorias.reduce((q, x) => q + (x.productos || 0), 0),
                0,
              );
              return (
                <li key={depKey}>
                  <div
                    onClick={() => toggle(depKey)}
                    className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-2"
                  >
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 text-faint transition-transform",
                        depOpen && "rotate-90",
                      )}
                    />
                    <FolderTree className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-medium text-fg">{depName}</span>
                    <Badge tone="neutral" className="ml-1">
                      {cats.length} cat · {num(depProds)} prod
                    </Badge>
                    <div className="ml-auto flex items-center gap-0.5">
                      <ActionBtn
                        icon={Plus}
                        title="Agregar categoría"
                        onClick={() => openCreate("category", dep.id)}
                      />
                      <ActionBtn
                        icon={Pencil}
                        title="Renombrar"
                        onClick={() => openRename("department", dep.id, depName)}
                      />
                      <ActionBtn
                        icon={Trash2}
                        title="Eliminar"
                        danger
                        onClick={() =>
                          openDelete({
                            level: "department",
                            id: dep.id,
                            name: depName,
                            childCount: cats.length,
                          })
                        }
                      />
                    </div>
                  </div>

                  {depOpen && (
                    <ul className="ml-6 border-l border-border/60 pl-2">
                      {cats.length === 0 && (
                        <li className="px-2 py-1.5 text-xs text-faint">
                          Sin categorías
                        </li>
                      )}
                      {cats.map(([catName, cat]) => {
                        const catKey = `c-${cat.id}`;
                        const catOpen = searchQuery ? true : expanded.has(catKey);
                        const subs = cat.subcategorias;
                        return (
                          <li key={catKey}>
                            <div
                              onClick={() => toggle(catKey)}
                              className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
                            >
                              <ChevronRight
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0 text-faint transition-transform",
                                  catOpen && "rotate-90",
                                )}
                              />
                              <Folder className="h-3.5 w-3.5 shrink-0 text-info" />
                              <span className="text-sm text-fg">{catName}</span>
                              <span className="text-xs text-faint">
                                ({subs.length})
                              </span>
                              <div className="ml-auto flex items-center gap-0.5">
                                <ActionBtn
                                  icon={Plus}
                                  title="Agregar subcategoría"
                                  onClick={() =>
                                    openCreate("subcategory", cat.id)
                                  }
                                />
                                <ActionBtn
                                  icon={Pencil}
                                  title="Renombrar"
                                  onClick={() =>
                                    openRename("category", cat.id, catName)
                                  }
                                />
                                <ActionBtn
                                  icon={Trash2}
                                  title="Eliminar"
                                  danger
                                  onClick={() =>
                                    openDelete({
                                      level: "category",
                                      id: cat.id,
                                      name: catName,
                                      childCount: subs.length,
                                    })
                                  }
                                />
                              </div>
                            </div>

                            {catOpen && (
                              <ul className="ml-6 border-l border-border/60 pl-2">
                                {subs.length === 0 && (
                                  <li className="px-2 py-1.5 text-xs text-faint">
                                    Sin subcategorías
                                  </li>
                                )}
                                {subs
                                  .slice()
                                  .sort((a, b) =>
                                    a.nombre.localeCompare(b.nombre),
                                  )
                                  .map((sub) => (
                                    <li
                                      key={sub.id}
                                      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
                                    >
                                      <Tag className="h-3.5 w-3.5 shrink-0 text-violet" />
                                      <span className="text-sm text-fg/90">
                                        {sub.nombre}
                                      </span>
                                      {sub.productos > 0 && (
                                        <Badge tone="neutral">
                                          {num(sub.productos)}
                                        </Badge>
                                      )}
                                      <div className="ml-auto flex items-center gap-0.5">
                                        <ActionBtn
                                          icon={Pencil}
                                          title="Renombrar"
                                          onClick={() =>
                                            openRename(
                                              "subcategory",
                                              sub.id,
                                              sub.nombre,
                                            )
                                          }
                                        />
                                        <ActionBtn
                                          icon={Trash2}
                                          title="Eliminar"
                                          danger
                                          onClick={() =>
                                            openDelete({
                                              level: "subcategory",
                                              id: sub.id,
                                              name: sub.nombre,
                                              childCount: sub.productos,
                                            })
                                          }
                                        />
                                      </div>
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Crear / Renombrar */}
      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={
          form?.mode === "create"
            ? `Nueva ${LEVEL_LABEL[form.level]}`
            : `Renombrar ${form ? LEVEL_LABEL[form.level] : ""}`
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => formMut.mutate()}
              loading={formMut.isPending}
              disabled={!nameInput.trim()}
            >
              {form?.mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </>
        }
      >
        <Input
          autoFocus
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && nameInput.trim()) formMut.mutate();
          }}
          placeholder="Nombre"
          className="w-full"
        />
        {formMut.isError && (
          <p className="mt-2 text-xs text-danger">
            {(formMut.error as Error).message}
          </p>
        )}
      </Dialog>

      {/* Eliminar */}
      <Dialog
        open={del !== null}
        onClose={() => setDel(null)}
        title={`Eliminar ${del ? LEVEL_LABEL[del.level] : ""}`}
        description={del ? `"${del.name}"` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDel(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => delMut.mutate()}
              loading={delMut.isPending}
            >
              Eliminar
            </Button>
          </>
        }
      >
        {del && del.childCount > 0 && (
          <label className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-dim/40 p-3 text-sm">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-fg">
              Tiene {num(del.childCount)}{" "}
              {del.level === "subcategory" ? "productos asociados" : "elementos hijos"}.
              Eliminar en cascada (forzar).
            </span>
          </label>
        )}
        {delMut.isError && (
          <p className="mt-2 text-xs text-danger">
            {(delMut.error as Error).message}
          </p>
        )}
      </Dialog>

      {/* ─────────── WIPE MODAL ─────────── */}
      <Dialog
        open={wipeOpen}
        onClose={() => {
          if (wipeMut.isPending) return;
          setWipeOpen(false);
          setWipeResult(null);
          setWipeConfirm("");
        }}
        title={wipeResult?.ok ? "Taxonomía eliminada" : "Limpiar toda la taxonomía"}
        footer={
          wipeResult?.ok ? null : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setWipeOpen(false);
                  setWipeConfirm("");
                }}
                disabled={wipeMut.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => wipeMut.mutate()}
                loading={wipeMut.isPending}
                disabled={wipeConfirm !== "LIMPIAR"}
              >
                <Eraser className="h-4 w-4" /> Limpiar todo
              </Button>
            </>
          )
        }
      >
        {!wipeResult?.ok ? (
          <>
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
              <div className="text-fg">
                Vas a borrar <strong>toda</strong> la taxonomía de{" "}
                <strong>{activeCompany?.name ?? "esta empresa"}</strong>. Esta acción
                <strong> no se puede deshacer</strong>. Te recomendamos exportar antes
                por si acaso.
              </div>
            </div>

            <div className="mb-3 rounded-lg border border-border-soft bg-surface-2 p-3 text-sm">
              <p className="mb-2 font-medium text-fg">Qué se va a borrar</p>
              <ul className="space-y-1 text-muted">
                <li>• <strong>{num(stats.deps)}</strong> departamento(s)</li>
                <li>• <strong>{num(stats.cats)}</strong> categoría(s)</li>
                <li>• <strong>{num(stats.subs)}</strong> subcategoría(s)</li>
                <li>• Todas las metas por categoría (category_targets)</li>
              </ul>
              <p className="mb-2 mt-3 font-medium text-fg">Qué NO se toca</p>
              <ul className="space-y-1 text-muted">
                <li>• Productos y variantes (quedarán sin clasificar)</li>
                <li>• Tipos de producto de BSale (quedarán sin mapear)</li>
                <li>• Historial de ventas y documentos</li>
              </ul>
            </div>

            <label className="mb-1 block text-sm text-muted">
              Para confirmar, escribí <code className="rounded bg-surface-3 px-1 text-xs font-mono">LIMPIAR</code>:
            </label>
            <Input
              autoFocus
              value={wipeConfirm}
              onChange={(e) => setWipeConfirm(e.target.value)}
              placeholder="LIMPIAR"
              className="w-full font-mono"
              disabled={wipeMut.isPending}
            />
            {wipeResult && !wipeResult.ok && (
              <p className="mt-2 text-xs text-danger">{wipeResult.message}</p>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-pill bg-success/15">
              <Eraser className="h-6 w-6 text-success" />
            </div>
            <p className="text-body font-semibold text-fg">{wipeResult.message}</p>
            {wipeResult.stats && (
              <ul className="mx-auto mt-3 max-w-xs space-y-1 text-left text-sm text-muted">
                <li>• <strong>{num(wipeResult.stats.departments_deleted)}</strong> departamento(s) borrado(s)</li>
                <li>• <strong>{num(wipeResult.stats.categories_deleted)}</strong> categoría(s) borrada(s)</li>
                <li>• <strong>{num(wipeResult.stats.subcategories_deleted)}</strong> subcategoría(s) borrada(s)</li>
                <li>• <strong>{num(wipeResult.stats.products_desclassified)}</strong> producto(s) sin clasificar</li>
                <li>• <strong>{num(wipeResult.stats.product_types_unmapped)}</strong> tipo(s) sin mapear</li>
                {wipeResult.stats.category_targets_deleted > 0 && (
                  <li>• <strong>{num(wipeResult.stats.category_targets_deleted)}</strong> meta(s) por categoría borrada(s)</li>
                )}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setWipeOpen(false);
                  setWipeResult(null);
                  setWipeConfirm("");
                }}
              >
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setWipeOpen(false);
                  setWipeResult(null);
                  setWipeConfirm("");
                  setImportText("");
                  setImportResult(null);
                  setImportOpen(true);
                }}
              >
                <Upload className="h-4 w-4" /> Importar taxonomía nueva
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ─────────── IMPORT MODAL ─────────── */}
      <Dialog
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportResult(null);
        }}
        title="Importar taxonomía"
        footer={
          !importResult?.ok ? (
            <Button
              onClick={() => importMut.mutate()}
              disabled={importMut.isPending || !importText.trim()}
            >
              <Upload className="h-4 w-4" />
              {importMut.isPending ? "Importando…" : "Importar"}
            </Button>
          ) : null
        }
      >
        {!importResult?.ok ? (
          <>
            <p className="mb-3 text-sm text-muted">
              Pegá el JSON con la taxonomía a importar. La estructura es{" "}
              <code className="rounded bg-surface-3 px-1 text-xs">
                {`{ "Depto": { "Cat": { "Sub": [] } } }`}
              </code>
              . <strong>Solo agrega lo que falta</strong> — no pisa entradas
              existentes ni las que editaste desde la UI.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{ "Cuidado Personal": { "Cabello": { "Shampoos": [] } } }'
              spellCheck={false}
              className="h-64 w-full resize-y rounded-md border border-border-soft bg-surface-2 p-3 font-mono text-xs text-fg focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {importResult && !importResult.ok && (
              <p className="mt-2 text-xs text-danger">{importResult.message}</p>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-pill bg-success/15">
              <Upload className="h-6 w-6 text-success" />
            </div>
            <p className="text-body font-semibold text-fg">
              {importResult.message}
            </p>
            {importResult.stats && (
              <ul className="mx-auto mt-3 max-w-xs space-y-1 text-sm text-muted">
                <li>
                  <strong>{importResult.stats.departments_inserted}</strong>{" "}
                  departamento(s) nuevo(s)
                </li>
                <li>
                  <strong>{importResult.stats.categories_inserted}</strong>{" "}
                  categoría(s) nueva(s)
                </li>
                <li>
                  <strong>{importResult.stats.subcategories_inserted}</strong>{" "}
                  subcategoría(s) nueva(s)
                </li>
              </ul>
            )}
            <Button
              className="mt-4"
              variant="ghost"
              onClick={() => {
                setImportOpen(false);
                setImportResult(null);
                setImportText("");
              }}
            >
              Cerrar
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}
