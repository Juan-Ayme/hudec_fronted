"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  EyeOff,
  Sliders,
  Building2,
  History,
  Target,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { CategoryTargetsPanel } from "@/features/config-targets/components/CategoryTargetsPanel";
import { VariantCostsPanel } from "@/features/config-costos/components/VariantCostsPanel";
import { GoalsPanel } from "@/features/config-goals/components/GoalsPanel";
import { DepartmentsPanel } from "@/features/config-departments/components/DepartmentsPanel";
import { ThresholdsPanel } from "@/features/config-thresholds/components/ThresholdsPanel";
import { CompanyPanel } from "@/features/config-company/components/CompanyPanel";
import { BackupsPanel } from "@/features/config-backups/components/BackupsPanel";

type Tab =
  | "departments"
  | "thresholds"
  | "company"
  | "goals"
  | "targets"
  | "costos"
  | "backups";

const VALID_TABS: readonly Tab[] = [
  "departments",
  "thresholds",
  "company",
  "goals",
  "targets",
  "costos",
  "backups",
];

function isValidTab(v: string | null): v is Tab {
  return v != null && (VALID_TABS as readonly string[]).includes(v);
}

export default function ConfiguracionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  // La URL es la fuente de verdad — sin state local, sin useEffect que la
  // sincronice. `changeTab` sólo hace router.replace() y el re-render viene
  // por el cambio de searchParams.
  const tab: Tab = isValidTab(tabParam) ? tabParam : "departments";

  const changeTab = (t: Tab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", t);
    router.replace(`/configuracion?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Departamentos: excluir o marcar estacional. Umbrales: tunear políticas. Empresa: marca y IDs BSale. Category targets y costos: admin BI. Respaldos: historial y restauración."
      />

      <Tabs value={tab} onChange={changeTab} />

      {tab === "departments" && <DepartmentsPanel />}
      {tab === "thresholds" && <ThresholdsPanel />}
      {tab === "company" && <CompanyPanel />}
      {tab === "goals" && <GoalsPanel />}
      {tab === "targets" && <CategoryTargetsPanel />}
      {tab === "costos" && <VariantCostsPanel />}
      {tab === "backups" && <BackupsPanel />}
    </div>
  );
}

// ───────────────────────────── Tabs ─────────────────────────────

function Tabs({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "departments", label: "Departamentos", icon: EyeOff },
    { id: "thresholds", label: "Umbrales", icon: Sliders },
    { id: "company", label: "Empresa", icon: Building2 },
    { id: "goals", label: "Metas", icon: Target },
    { id: "targets", label: "Category targets", icon: ShieldCheck },
    { id: "costos", label: "Costos", icon: DollarSign },
    { id: "backups", label: "Respaldos", icon: History },
  ];
  return (
    <div className="mb-4 inline-flex rounded-lg border border-border/40 bg-surface-2 p-1">
      {items.map((it) => {
        const active = value === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-surface text-fg shadow-sm"
                : "text-muted hover:text-fg",
            )}
          >
            <Icon className="h-4 w-4" />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
