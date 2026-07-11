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
  type ProductTypeFilters,
} from "@/lib/api";
import type { ProductType } from "@/lib/types";
import type { Toggle } from "../lib";

/**
 * Hook de /product-types: estado de UI (búsqueda con debounce, toggle de
 * filtro, diálogos de crear/editar/eliminar) + queries de product types y
 * subcategorías + mutations (guardar, eliminar, resincronizar).
 */
export function useProductTypes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [toggle, setToggle] = useState<Toggle>("all");

  // edición / creación
  const [editing, setEditing] = useState<ProductType | "new" | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [subInput, setSubInput] = useState("");
  const [del, setDel] = useState<ProductType | null>(null);
  const [force, setForce] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["product-types"] });
    qc.invalidateQueries({ queryKey: ["products-summary"] });
    qc.invalidateQueries({ queryKey: ["audits"] });
  };

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
    },
  });

  const delMut = useMutation({
    mutationFn: () =>
      deleteProductType((del as ProductType).bsale_product_type_id, force),
    onSuccess: () => {
      invalidate();
      setDel(null);
      setForce(false);
    },
  });

  const resyncMut = useMutation({
    mutationFn: (id: number) => resyncProductType(id),
    onSuccess: invalidate,
  });

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

  return {
    search,
    setSearch,
    toggle,
    setToggle,
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
  };
}
