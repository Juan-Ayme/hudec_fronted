"use client";

import { Wand2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Auto-fix de nombres de product_types. */
export function AutoFixNamingCard({
  fixResult,
  namingMismatches,
  onPreview,
  onApply,
  previewLoading,
  applyLoading,
}: {
  fixResult: string | null;
  namingMismatches: number;
  onPreview: () => void;
  onApply: () => void;
  previewLoading: boolean;
  applyLoading: boolean;
}) {
  return (
    <Card className="mt-4">
      <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Wand2 className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-fg">
              Corregir nombres de product_types
            </p>
            <p className="text-xs text-muted">
              Renombra en BSale + BD para cumplir &quot;Categoría /
              Subcategoría&quot;. {fixResult && <span className="text-success">{fixResult}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onPreview}
            loading={previewLoading}
          >
            Previsualizar
          </Button>
          <Button
            onClick={onApply}
            loading={applyLoading}
            disabled={namingMismatches === 0}
          >
            Aplicar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
