"use client";

import {
  ChevronRight,
  Folder,
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Tag,
} from "lucide-react";
import { num } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeleteState, Level } from "../lib";
import type { useTaxonomia } from "../hooks/useTaxonomia";

type FilteredDepartments = ReturnType<typeof useTaxonomia>["filteredDepartments"];

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

export function TaxonomiaTree({
  filteredDepartments,
  searchQuery,
  expanded,
  toggle,
  openCreate,
  openRename,
  openDelete,
  readOnly,
}: {
  filteredDepartments: FilteredDepartments;
  searchQuery: string;
  expanded: Set<string>;
  toggle: (key: string) => void;
  openCreate: (level: Level, parentId?: number) => void;
  openRename: (level: Level, id: number, currentName: string) => void;
  openDelete: (d: DeleteState) => void;
  readOnly?: boolean;
}) {
  return (
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
                {!readOnly && (
                  <>
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
                  </>
                )}
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
                          {!readOnly && (
                            <>
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
                            </>
                          )}
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
                                  {!readOnly && (
                                    <>
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
                                    </>
                                  )}
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
  );
}
