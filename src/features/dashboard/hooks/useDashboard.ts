"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getKpis,
  getSalesByDay,
  getSalesByDepartment,
  getSalesByOffice,
  getStockValuation,
  getTopProducts,
} from "@/lib/api";
import { useSucursal } from "@/components/sucursal-context";

/**
 * Hook del dashboard raíz (`/`): rango de días + sucursal activa + las 6
 * queries de analítica que alimentan el bento grid, más el flag agregado de
 * loading para el skeleton inicial.
 */
export function useDashboard() {
  const [days, setDays] = useState(30);
  const { officeId } = useSucursal();

  const kpis = useQuery({
    queryKey: ["kpis", days, officeId],
    queryFn: ({ signal }) => getKpis(days, signal, officeId),
  });
  const byDay = useQuery({
    queryKey: ["sales-by-day", days, officeId],
    queryFn: ({ signal }) => getSalesByDay(days, signal, officeId),
  });
  const byDept = useQuery({
    queryKey: ["sales-by-department", days, officeId],
    queryFn: ({ signal }) => getSalesByDepartment(days, signal, officeId),
  });
  const byOffice = useQuery({
    queryKey: ["sales-by-office", days],
    queryFn: ({ signal }) => getSalesByOffice(days, signal),
  });
  const valuation = useQuery({
    queryKey: ["stock-valuation"],
    queryFn: ({ signal }) => getStockValuation(signal),
  });
  const top = useQuery({
    queryKey: ["top-products", days, officeId],
    queryFn: ({ signal }) => getTopProducts(days, 10, signal, officeId),
  });

  const isAnyLoading =
    kpis.isLoading ||
    byDay.isLoading ||
    byDept.isLoading ||
    valuation.isLoading ||
    top.isLoading ||
    byOffice.isLoading;

  return {
    days,
    setDays,
    officeId,
    kpis,
    byDay,
    byDept,
    byOffice,
    valuation,
    top,
    isAnyLoading,
  };
}
