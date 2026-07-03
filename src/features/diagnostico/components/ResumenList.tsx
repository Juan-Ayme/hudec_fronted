"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

/** Bullets textuales generados por el backend con la lectura del período. */
export function ResumenList({ resumen }: { resumen: string[] }) {
  if (resumen.length === 0) return null;
  return (
    <Card>
      <CardHeader
        eyebrow="Lectura del período"
        title={
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Resumen
          </span>
        }
      />
      <CardBody>
        <ul className="flex flex-col gap-2">
          {resumen.map((line, i) => (
            <li key={i} className="flex gap-2 text-body text-fg/90">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
