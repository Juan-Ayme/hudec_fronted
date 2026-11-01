"use client";

import { Layers, FolderTree, Boxes } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { PeriodSelect } from "@/components/ui/period-select";
import { ECOSISTEMA_PERIODOS } from "../hooks/useEcosistema";
import type { EcosistemaNivel } from "@/lib/bi-types";

const NIVEL_TABS: TabItem<EcosistemaNivel>[] = [
  { id: "departamento", label: "Departamento", icon: Layers },
  { id: "categoria", label: "Categoría", icon: FolderTree },
  { id: "subcategoria", label: "Subcategoría", icon: Boxes },
];

/** Barra de controles: nivel de agregación + ventana de días. */
export function EcosistemaControls({
  nivel,
  onNivel,
  dias,
  onDias,
}: {
  nivel: EcosistemaNivel;
  onNivel: (n: EcosistemaNivel) => void;
  dias: number;
  onDias: (d: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs items={NIVEL_TABS} value={nivel} onChange={onNivel} />
      <PeriodSelect value={dias} onChange={onDias} options={ECOSISTEMA_PERIODOS} />
    </div>
  );
}
