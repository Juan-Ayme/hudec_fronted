// Selection/ROOT_SELECTION viven en @/lib/types (compartidos con centro-catalogo);
// se re-exportan acá para no romper los imports existentes de la feature.
export type { Selection } from "@/lib/types";
export { ROOT_SELECTION } from "@/lib/types";

export type TreeNode = {
  name: string;
  skus: number;
  ventaSoles: number;
  criticos: number;
  altas: number;
  children: TreeNode[];
};

export type SeverityFilter = "todas" | "critico" | "alta";

export type TendenciaFilter = "todas" | "creciente" | "estable" | "decreciente";
export type StockFilter = "todos" | "con_stock" | "sin_stock";

export type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};
