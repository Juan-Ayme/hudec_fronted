"use client";

import { Pencil, Link2Off, RefreshCw, Trash2, Tags, CircleAlert } from "lucide-react";
import { updateProductType } from "@/lib/api";
import { num } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import type { ProductType, ProductTypesResponse } from "@/lib/types";

export function ProductTypesTable({
  data,
  isLoading,
  error,
  onEdit,
  onResync,
  onDelete,
  invalidate,
}: {
  data: ProductTypesResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  onEdit: (pt: ProductType) => void;
  onResync: (id: number) => void;
  onDelete: (pt: ProductType) => void;
  invalidate: () => void;
}) {
  const columns: Column<ProductType>[] = [
    {
      key: "name",
      header: "Product Type (BSale)",
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="line-clamp-1 font-medium text-fg">{r.name}</span>
          {!r.naming_ok && r.is_mapped && (
            <span title="El nombre no sigue 'Categoría / Subcategoría'">
              <CircleAlert className="h-3.5 w-3.5 text-warning" />
            </span>
          )}
        </div>
      ),
    },
    {
      key: "mapping",
      header: "Mapeo",
      render: (r) =>
        r.is_mapped ? (
          <div className="text-xs">
            <span className="text-fg">{r.subcategory}</span>
            <span className="text-faint">
              {" "}
              · {r.department} / {r.category}
            </span>
          </div>
        ) : (
          <Badge tone="warning">Sin mapear</Badge>
        ),
    },
    {
      key: "productos",
      header: "Prod.",
      align: "right",
      render: (r) => num(r.productos),
    },
    {
      key: "estado",
      header: "Estado",
      align: "center",
      render: (r) =>
        r.is_active ? (
          <Badge tone="success">Activo</Badge>
        ) : (
          <Badge tone="neutral">Inactivo</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end gap-0.5">
          <IconBtn title="Editar / mapear" onClick={() => onEdit(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </IconBtn>
          {r.is_mapped && (
            <IconBtn
              title="Quitar mapeo"
              onClick={() =>
                updateProductType(r.bsale_product_type_id, {}, true).then(
                  invalidate,
                )
              }
            >
              <Link2Off className="h-3.5 w-3.5" />
            </IconBtn>
          )}
          <IconBtn
            title="Resincronizar desde BSale"
            onClick={() => onResync(r.bsale_product_type_id)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn title="Eliminar" danger onClick={() => onDelete(r)}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={data?.items}
        isLoading={isLoading}
        error={error}
        rowKey={(r) => r.bsale_product_type_id}
        emptyTitle="Sin product types"
      />
      {data && (
        <p className="mt-2 text-xs text-faint">
          {num(data.total)} resultados <Tags className="inline h-3 w-3" />
        </p>
      )}
    </>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={cn(
        "rounded-md p-1.5 text-faint transition-colors",
        danger
          ? "hover:bg-danger/15 hover:text-danger"
          : "hover:bg-surface-3 hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
