"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getProductTypes,
  getSubcategories,
  createProductType,
  updateProductType,
  deleteProductType,
  resyncProductType,
  getProductTypesWorkspace,
  pullProductTypesFromBsale,
  type ProductTypeFilters,
} from "@/lib/api";
import { toast } from "@/lib/toast";
import type { ProductType } from "@/lib/types";
import type { Toggle } from "../lib";
import type { WorkspaceTrayId } from "../components/WorkspaceTable";

export function useProductTypes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [toggle, setToggle] = useState<Toggle>("all");

  // Bandeja activa del workspace
  // null = el usuario aún no eligió: se usa la bandeja por defecto del resumen.
  const [chosenTray, setActiveTrayState] = useState<WorkspaceTrayId | null>(null);

  // Selección múltiple para acciones masivas
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Diálogos de creación / edición / eliminación individual
  const [editing, setEditing] = useState<ProductType | "new" | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [subInput, setSubInput] = useState("");
  const [del, setDel] = useState<ProductType | null>(null);
  const [force, setForce] = useState(false);

  // Diálogos de operaciones masivas
  const [bulkMapOpen, setBulkMapOpen] = useState(false);
  const [bulkMapItems, setBulkMapItems] = useState<ProductType[]>([]);

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<ProductType[]>([]);
  const [bulkDeleteAllEmpty, setBulkDeleteAllEmpty] = useState(false);

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSources, setMergeSources] = useState<ProductType[]>([]);

  const [bulkChangeTypeOpen, setBulkChangeTypeOpen] = useState(false);
  const [changeTypeTargetId, setChangeTypeTargetId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Query del Workspace completo de Reclasificación
  const workspaceQuery = useQuery({
    queryKey: ["product-types-workspace"],
    queryFn: ({ signal }) => getProductTypesWorkspace(signal),
    staleTime: 60_000,
  });

  // Bandeja por defecto según resumen (hasta que el usuario elija otra)
  const summary = workspaceQuery.data?.summary;
  const defaultTray: WorkspaceTrayId = !summary
    ? "unmapped_with_products"
    : summary.unmapped_with_products_count > 0
      ? "unmapped_with_products"
      : summary.unmapped_empty_count > 0
        ? "unmapped_empty"
        : "mapped";
  const activeTray = chosenTray ?? defaultTray;

  const setActiveTray = (tray: WorkspaceTrayId) => {
    setActiveTrayState(tray);
    setSelectedIds(new Set());
  };

  const filters: ProductTypeFilters = useMemo(
    () => ({
      q: q || undefined,
      only_unmapped: toggle === "unmapped" || undefined,
      only_inactive: toggle === "inactive" || undefined,
      limit: 1000,
    }),
    [q, toggle],
  );

  const pts = useQuery({
    queryKey: ["product-types", filters],
    queryFn: ({ signal }) => getProductTypes(filters, signal),
    placeholderData: keepPreviousData,
  });

  const subs = useQuery({
    queryKey: ["subcategories-all"],
    queryFn: ({ signal }) => getSubcategories(undefined, signal),
    staleTime: 5 * 60_000,
  });

  // Lista unificada de todos los tipos existentes
  const allTypes: ProductType[] = useMemo(() => {
    if (workspaceQuery.data) {
      return [
        ...workspaceQuery.data.unmapped_with_products,
        ...workspaceQuery.data.unmapped_empty,
        ...workspaceQuery.data.mapped,
      ];
    }
    return pts.data?.items ?? [];
  }, [workspaceQuery.data, pts.data]);

  // Items de la bandeja activa
  const trayItems: ProductType[] = useMemo(() => {
    if (!workspaceQuery.data) return [];
    switch (activeTray) {
      case "unmapped_with_products":
        return workspaceQuery.data.unmapped_with_products;
      case "unmapped_empty":
        return workspaceQuery.data.unmapped_empty;
      case "mapped":
        return workspaceQuery.data.mapped;
      default:
        return [];
    }
  }, [workspaceQuery.data, activeTray]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["product-types-workspace"] });
    qc.invalidateQueries({ queryKey: ["product-types"] });
    qc.invalidateQueries({ queryKey: ["audits"] });
  };

  // Pull directo desde BSale
  const pullMut = useMutation({
    mutationFn: () => pullProductTypesFromBsale(),
    onSuccess: (data) => {
      invalidate();
      toast.success("Tipos sincronizados desde BSale", {
        description: `${data.stats.fetched_from_bsale} recibidos: ${data.stats.new_inserted} nuevos, ${data.stats.updated} actualizados, ${data.stats.auto_mapped} auto-mapeados.`,
      });
    },
    onError: (err) => {
      toast.error("Error al jalar tipos desde BSale", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  // Mutaciones individuales
  const saveMut = useMutation({
    mutationFn: async () => {
      const name = nameInput.trim();
      if (editing === "new") {
        return createProductType(name, subInput === "" ? null : Number(subInput));
      }
      const pt = editing as ProductType;
      const unmap = subInput === "";
      return updateProductType(
        pt.bsale_product_type_id,
        {
          name: name !== pt.name ? name : undefined,
          subcategory_id: unmap ? undefined : Number(subInput),
        },
        unmap && pt.is_mapped,
      );
    },
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success(editing === "new" ? "Tipo creado" : "Tipo actualizado");
    },
    onError: (err) => {
      toast.error("Error al guardar tipo", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const delMut = useMutation({
    mutationFn: () =>
      deleteProductType((del as ProductType).bsale_product_type_id, force),
    onSuccess: () => {
      invalidate();
      setDel(null);
      setForce(false);
      toast.success("Tipo eliminado");
    },
    onError: (err) => {
      toast.error("Error al eliminar tipo", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  const resyncMut = useMutation({
    mutationFn: (id: number) => resyncProductType(id),
    onSuccess: () => {
      invalidate();
      toast.success("Tipo resincronizado desde BSale");
    },
    onError: (err) => {
      toast.error("Error al resincronizar", {
        description: err instanceof Error ? err.message : undefined,
      });
    },
  });

  // Operaciones de selección
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (ids: number[]) => {
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Apertura de diálogos
  const openNew = () => {
    setEditing("new");
    setNameInput("");
    setSubInput("");
    saveMut.reset();
  };

  const openEdit = (pt: ProductType) => {
    setEditing(pt);
    setNameInput(pt.name);
    setSubInput(pt.subcategory_id ? String(pt.subcategory_id) : "");
    saveMut.reset();
  };

  const openBulkMap = (types: ProductType[]) => {
    setBulkMapItems(types);
    setBulkMapOpen(true);
  };

  const openBulkDelete = (types: ProductType[], deleteAllEmpty: boolean = false) => {
    setBulkDeleteItems(types);
    setBulkDeleteAllEmpty(deleteAllEmpty);
    setBulkDeleteOpen(true);
  };

  const openMerge = (types: ProductType[]) => {
    setMergeSources(types);
    setMergeOpen(true);
  };

  const openBulkChangeType = (pt?: ProductType) => {
    setChangeTypeTargetId(pt?.bsale_product_type_id);
    setBulkChangeTypeOpen(true);
  };

  return {
    search,
    setSearch,
    toggle,
    setToggle,
    activeTray,
    setActiveTray,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    trayItems,
    allTypes,
    workspaceQuery,
    pullMut,
    editing,
    setEditing,
    nameInput,
    setNameInput,
    subInput,
    setSubInput,
    del,
    setDel,
    force,
    setForce,
    pts,
    subs,
    invalidate,
    saveMut,
    delMut,
    resyncMut,
    openNew,
    openEdit,
    // Modales masivos
    bulkMapOpen,
    setBulkMapOpen,
    bulkMapItems,
    openBulkMap,
    bulkDeleteOpen,
    setBulkDeleteOpen,
    bulkDeleteItems,
    bulkDeleteAllEmpty,
    openBulkDelete,
    mergeOpen,
    setMergeOpen,
    mergeSources,
    openMerge,
    bulkChangeTypeOpen,
    setBulkChangeTypeOpen,
    changeTypeTargetId,
    openBulkChangeType,
  };
}
