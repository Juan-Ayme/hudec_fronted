"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSalesByDay,
  getSalesByCategory,
  getTicketAnatomy,
} from "@/lib/api";
import { useSucursal } from "@/components/sucursal-context";

/**
 * Hook de /graficos: rango de días + sucursal activa + las queries activas de
 * analítica visual (evolución, categorías y anatomía del ticket) + flag agregado de loading.
 */
export function useGraficos() {
  const [days, setDays] = useState(30);
  const { officeId } = useSucursal();

  const byDay = useQuery({
    queryKey: ["sales-by-day", days, officeId],
    queryFn: ({ signal }) => getSalesByDay(days, signal, officeId),
  });

  const byCategory = useQuery({
    queryKey: ["sales-by-category", days, officeId],
    queryFn: ({ signal }) => getSalesByCategory(days, signal, officeId),
  });

  const ticketAnatomy = useQuery({
    queryKey: ["ticket-anatomy", days, officeId],
    queryFn: ({ signal }) => getTicketAnatomy(days, "previous_period", signal, officeId),
  });

  const anat = ticketAnatomy.data?.delta_pct;

  const isAnyLoading =
    byDay.isLoading ||
    byCategory.isLoading ||
    ticketAnatomy.isLoading;

  return {
    days,
    setDays,
    byDay,
    byCategory,
    ticketAnatomy,
    anat,
    isAnyLoading,
  };
}
