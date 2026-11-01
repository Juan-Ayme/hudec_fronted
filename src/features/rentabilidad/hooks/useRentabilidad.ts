"use client";

import { useState } from "react";
import { request } from "@/lib/api";
import { useSucursal } from "@/components/sucursal-context";
import { useBIQuery } from "@/features/bi/shared";

export type RentabilidadLevel = "department" | "category" | "subcategory";

export interface RankingItem {
  level: string;
  name: string;
  parent_department: string | null;
  parent_category: string | null;
  venta_neta: number;
  costo_total: number;
  margen_bruto: number;
  margen_pct: number;
  productos_unicos: number;
  unidades_vendidas: number;
  margen_por_unidad: number;
  pct_contribucion_margen: number;
}

export interface RankingResponse {
  meta: {
    days: number;
    office_id: number | null;
    from: string;
    to: string;
  };
  global: {
    margen_bruto: number;
    venta_neta: number;
    margen_pct: number;
  };
  ranking: RankingItem[];
}

export interface MatrixItem {
  department: string;
  category: string;
  subcategory: string;
  venta_neta: number;
  costo_total: number;
  margen_bruto: number;
  margen_pct: number;
  unidades: number;
  productos: number;
  clasificacion: "estrella" | "joya_oculta" | "trampa_volumen" | "debil";
}

export interface MatrixResponse {
  meta: {
    days: number;
    office_id: number | null;
    group_by: string;
    from: string;
    to: string;
    mediana_margen: number;
    mediana_volumen: number;
  };
  conteo: Record<string, number>;
  items: MatrixItem[];
}

export interface EvolucionRow {
  periodo: string;
  dim: string;
  ventas: number;
  venta_neta?: number;
  unidades: number;
  tickets: number;
  ticket_promedio: number;
  margen_soles: number;
  margen_pct: number | null;
  participacion_pct: number;
  crecimiento_mom_pct: number | null;
  crecimiento_yoy_pct: number | null;
  skus_activos: number;
  cobertura_costos_pct: number | null;
  parcial: boolean;
}

function getRanking(days: number, officeId: number | null, level: string) {
  return request<RankingResponse>("/analytics/margin-profitability-ranking", {
    query: { days, office_id: officeId ?? undefined, level },
  });
}

function getMatrix(days: number, officeId: number | null, groupBy: string) {
  return request<MatrixResponse>("/analytics/margin-comparative-matrix", {
    query: { days, office_id: officeId ?? undefined, group_by: groupBy },
  });
}

const DIM_MAP: Record<RentabilidadLevel, string> = {
  department: "departamento",
  category: "categoria",
  subcategory: "subcategoria",
};

export function useRentabilidad() {
  const { officeId } = useSucursal();
  const [days, setDays] = useState(30);
  const [level, setLevel] = useState<RentabilidadLevel>("department");

  const rankingQ = useBIQuery<RankingResponse>({
    queryKey: ["bi", "rentabilidad", "ranking", officeId, days],
    queryFn: ({ signal }) => getRanking(days, officeId, "all"),
  });

  const matrixQ = useBIQuery<MatrixResponse>({
    queryKey: ["bi", "rentabilidad", "matrix", officeId, days, level],
    queryFn: ({ signal }) => getMatrix(days, officeId, level),
  });

  const evolucionQ = useBIQuery<EvolucionRow[]>({
    queryKey: ["bi", "rentabilidad", "evolucion", officeId, level],
    queryFn: () =>
      request<EvolucionRow[]>("/analytics/evolucion", {
        query: {
          dimension: DIM_MAP[level],
          meses: 12,
          top: 5,
          office_id: officeId ?? undefined,
        },
      }),
  });

  return {
    days,
    setDays,
    level,
    setLevel,
    officeId,
    rankingQ,
    matrixQ,
    evolucionQ,
  };
}
