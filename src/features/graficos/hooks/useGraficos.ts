"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSalesByDay,
  getSalesByDepartment,
  getSalesByCategory,
  getSalesByOffice,
  getTicketAnatomy,
  getTopProducts,
} from "@/lib/api";
import { useSucursal } from "@/components/sucursal-context";

/**
 * Hook de /graficos: rango de días + sucursal activa + las 6 queries de
 * analítica visual (evolución, mix, sucursales, categorías, productos y
 * anatomía del ticket) + flag agregado de loading para el skeleton.
 */
export function useGraficos() {
  const [days, setDays] = useState(30);
  const { officeId } = useSucursal();

  const byDay = useQuery({
    queryKey: ["sales-by-day", days, officeId],
    queryFn: ({ signal }) => getSalesByDay(days, signal, officeId),
  });

  const byDept = useQuery({
    queryKey: ["sales-by-department", days, officeId],
    queryFn: ({ signal }) => getSalesByDepartment(days, signal, officeId),
  });

  const byCategory = useQuery({
    queryKey: ["sales-by-category", days, officeId],
    queryFn: ({ signal }) => getSalesByCategory(days, signal, officeId),
  });

  const byOffice = useQuery({
    queryKey: ["sales-by-office", days],
    queryFn: ({ signal }) => getSalesByOffice(days, signal),
  });

  const ticketAnatomy = useQuery({
    queryKey: ["ticket-anatomy", days, officeId],
    queryFn: ({ signal }) => getTicketAnatomy(days, "previous_period", signal, officeId),
  });

  const topProducts = useQuery({
    queryKey: ["top-products", days, officeId],
    queryFn: ({ signal }) => getTopProducts(days, 15, signal, officeId),
  });

  const anat = ticketAnatomy.data?.delta_pct;

  const isAnyLoading =
    byDay.isLoading ||
    byDept.isLoading ||
    byCategory.isLoading ||
    byOffice.isLoading ||
    ticketAnatomy.isLoading ||
    topProducts.isLoading;

  return {
    days,
    setDays,
    byDay,
    byDept,
    byCategory,
    byOffice,
    ticketAnatomy,
    topProducts,
    anat,
    isAnyLoading,
  };
}
