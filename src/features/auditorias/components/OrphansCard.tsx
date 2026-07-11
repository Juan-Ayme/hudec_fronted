"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { num } from "@/lib/format";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";

type OrphanRow = { id: number; name: string; is_active: boolean };

/** Tipos huérfanos sin productos: candidatos seguros a eliminar. */
export function OrphansCard({
  orphans,
}: {
  orphans: UseQueryResult<OrphanRow[], Error>;
}) {
  return (
    <Card className="mt-4">
      <CardHeader
        title="Tipos huérfanos sin productos"
        subtitle="Candidatos seguros a eliminar (sin mapeo y sin productos)"
        action={
          <Badge tone="neutral">
            <Trash2 className="h-3 w-3" /> {num(orphans.data?.length)}
          </Badge>
        }
      />
      <CardBody className="pt-0">
        <DataTable
          columns={[
            { key: "id", header: "ID", align: "right" },
            { key: "name", header: "Nombre" },
            {
              key: "is_active",
              header: "Estado",
              render: (r: { is_active: boolean }) =>
                r.is_active ? (
                  <Badge tone="success">Activo</Badge>
                ) : (
                  <Badge tone="neutral">Inactivo</Badge>
                ),
            },
          ]}
          rows={orphans.data}
          isLoading={orphans.isLoading}
          error={orphans.error}
          emptyTitle="No hay tipos huérfanos sin productos"
          maxHeight="320px"
        />
      </CardBody>
    </Card>
  );
}
