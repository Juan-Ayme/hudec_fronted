"use client";

import { useState } from "react";
import { Download, CalendarRange, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { useSucursal } from "@/components/sucursal-context";
import { API_BASE_URL, downloadExcelFile } from "@/lib/api";

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDaysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function ComprasHistoricoPage() {
  const [startDate, setStartDate] = useState(getDaysAgoIso(30));
  const [endDate, setEndDate] = useState(getTodayIso);
  const [loading, setLoading] = useState(false);
  const { officeId, sucursalName } = useSucursal();

  const handleDownload = async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_BASE_URL}/analytics/compras-historico/excel`);
      url.searchParams.append("start_date", startDate);
      url.searchParams.append("end_date", endDate);
      if (officeId !== null) {
        url.searchParams.append("office_id", officeId.toString());
      }

      await downloadExcelFile(
        url.toString(),
        `Compras_Historico_${startDate}_${endDate}.xlsx`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compras"
        title="Análisis de Compras Histórico"
        description="Genera un reporte Excel de ventas agrupadas por jerarquía, cruzadas con el stock actual y sugerencias de compra para 10 días."
      />

      <Card className="max-w-xl">
        <CardHeader
          eyebrow="Parámetros de Exportación"
          title={
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Rango de Fechas
            </span>
          }
          subtitle={
            officeId !== null
              ? `Filtrado por sucursal: ${sucursalName ?? `#${officeId}`}`
              : "Consolidado de todas las tiendas activas"
          }
        />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Fecha Inicio">
              <Input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="Fecha Fin">
              <Input
                type="date"
                value={endDate}
                min={startDate}
                max={getTodayIso()}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-caption text-muted">
            <CalendarRange className="h-3.5 w-3.5 text-faint" />
            <span>Accesos rápidos:</span>
            {[
              { label: "Últimos 7 días", days: 7 },
              { label: "Últimos 30 días", days: 30 },
              { label: "Últimos 90 días", days: 90 },
            ].map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => {
                  setStartDate(getDaysAgoIso(preset.days));
                  setEndDate(getTodayIso());
                }}
                className="rounded-lg border border-border-soft bg-surface-2 px-2.5 py-1 text-caption font-medium text-muted hover:bg-surface-3 hover:text-fg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <Button
            onClick={handleDownload}
            loading={loading}
            disabled={loading || !startDate || !endDate || startDate > endDate}
            className="w-full"
          >
            <Download className="h-4 w-4" />
            {loading ? "Generando reporte…" : "Descargar Excel Histórico"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
