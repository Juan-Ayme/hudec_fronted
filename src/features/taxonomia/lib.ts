/* ────────────────────────────────────────────────────────────
 * Tipos + constantes compartidos por el hook y los componentes de
 * /taxonomia. Sin lógica de React ni de fetching.
 * ──────────────────────────────────────────────────────────── */

export type Level = "department" | "category" | "subcategory";

export interface FormState {
  mode: "create" | "rename";
  level: Level;
  parentId?: number;
  id?: number;
  currentName?: string;
}

export interface DeleteState {
  level: Level;
  id: number;
  name: string;
  childCount: number;
}

export const LEVEL_LABEL: Record<Level, string> = {
  department: "departamento",
  category: "categoría",
  subcategory: "subcategoría",
};
