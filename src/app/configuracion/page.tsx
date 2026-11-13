"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EyeOff,
  Building2,
  History,
  Target,
  ShieldCheck,
  DollarSign,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-context";
import { CategoryTargetsPanel } from "@/features/config-targets/components/CategoryTargetsPanel";
import { VariantCostsPanel } from "@/features/config-costos/components/VariantCostsPanel";
import { GoalsPanel } from "@/features/config-goals/components/GoalsPanel";
import { DepartmentsPanel } from "@/features/config-departments/components/DepartmentsPanel";
import { CompanyPanel } from "@/features/config-company/components/CompanyPanel";
import { BackupsPanel } from "@/features/config-backups/components/BackupsPanel";
import { UsuariosView } from "@/features/usuarios/components/UsuariosView";

type ConfigTab =
  | "departments"
  | "company"
  | "goals"
  | "targets"
  | "costos"
  | "backups"
  | "usuarios";

function ConfiguracionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { companies } = useAuth();
  const canManageUsers = companies.some((c) => c.role === "admin");

  const items: TabItem<ConfigTab>[] = [
    { id: "departments", label: "Departamentos", icon: EyeOff },
    { id: "company", label: "Empresa", icon: Building2 },
    { id: "goals", label: "Metas", icon: Target },
    { id: "targets", label: "Category targets", icon: ShieldCheck },
    { id: "costos", label: "Costos & Auditoría", icon: DollarSign },
    { id: "backups", label: "Respaldos", icon: History },
    ...(canManageUsers
      ? [{ id: "usuarios" as const, label: "Usuarios", icon: Users }]
      : []),
  ];

  const tabParam = searchParams.get("tab");
  const tab: ConfigTab =
    items.some((i) => i.id === tabParam)
      ? (tabParam as ConfigTab)
      : "departments";

  const changeTab = (t: ConfigTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", t);
    router.replace(`/configuracion?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configuración & Administración"
        description="Departamentos y Empresa: visibilidad y marca. Metas, Category targets y Costos: motor BI y diagnóstico por sucursal. Respaldos y Usuarios: administración del sistema."
      />

      <Tabs items={items} value={tab} onChange={changeTab} />

      {tab === "departments" && <DepartmentsPanel />}
      {tab === "company" && <CompanyPanel />}
      {tab === "goals" && <GoalsPanel />}
      {tab === "targets" && <CategoryTargetsPanel />}
      {tab === "costos" && <VariantCostsPanel />}
      {tab === "backups" && <BackupsPanel />}
      {tab === "usuarios" && canManageUsers && <UsuariosView />}
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={null}>
      <ConfiguracionContent />
    </Suspense>
  );
}
