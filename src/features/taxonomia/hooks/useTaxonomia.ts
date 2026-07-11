"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import type { DeleteState, FormState, Level } from "../lib";

/**
 * Hook de /taxonomia: query del árbol + mutations (crear/renombrar/eliminar,
 * importar, limpiar todo) + estado de UI local (expandido, búsqueda,
 * diálogos) + derivados (departamentos, filtrado por búsqueda, stats).
 */
export function useTaxonomia() {
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

  return {
    tree,
    departments,
    filteredDepartments,
    stats,
    activeCompany,
    expanded,
    toggle,
    searchQuery,
    setSearchQuery,
    handleExport,
    openCreate,
    openRename,
    openDelete,
    form,
    setForm,
    nameInput,
    setNameInput,
    formMut,
    del,
    setDel,
    force,
    setForce,
    delMut,
    importOpen,
    setImportOpen,
    importText,
    setImportText,
    importResult,
    setImportResult,
    importMut,
    wipeOpen,
    setWipeOpen,
    wipeConfirm,
    setWipeConfirm,
    wipeResult,
    setWipeResult,
    wipeMut,
  };
}
