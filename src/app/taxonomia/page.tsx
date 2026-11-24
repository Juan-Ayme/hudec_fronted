"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderTree, Tags, ClipboardCheck, ListChecks } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { useCompany } from "@/components/company-context";
import { TaxonomiaView } from "@/features/taxonomia/components/TaxonomiaView";
import { ProductTypesView } from "@/features/product-types/components/ProductTypesView";
import { AuditoriasView } from "@/features/auditorias/components/AuditoriasView";
import { AtributosView } from "@/features/atributos/components/AtributosView";

type TaxonomiaTab = "arbol" | "tipologias" | "auditoria" | "atributos";

function TaxonomiaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeRole } = useCompany();
  const isViewer = activeRole === "viewer" || activeRole === null;

  const items: TabItem<TaxonomiaTab>[] = isViewer
    ? [{ id: "arbol", label: "Árbol de Taxonomía", icon: FolderTree }]
    : [
        { id: "arbol", label: "Árbol de Taxonomía", icon: FolderTree },
        { id: "tipologias", label: "Tipologías BSale", icon: Tags },
        { id: "auditoria", label: "Auditoría de Clasificación", icon: ClipboardCheck },
        { id: "atributos", label: "Atributos", icon: ListChecks },
      ];

  const rawTab = searchParams.get("tab");
  const tab: TaxonomiaTab =
    items.some((i) => i.id === rawTab) ? (rawTab as TaxonomiaTab) : "arbol";

  const changeTab = (next: TaxonomiaTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    router.replace(`/taxonomia?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      {items.length > 1 && (
        <Tabs items={items} value={tab} onChange={changeTab} />
      )}
      {tab === "arbol" && <TaxonomiaView />}
      {tab === "tipologias" && <ProductTypesView />}
      {tab === "auditoria" && <AuditoriasView />}
      {tab === "atributos" && <AtributosView />}
    </div>
  );
}

export default function TaxonomiaPage() {
  return (
    <Suspense fallback={null}>
      <TaxonomiaContent />
    </Suspense>
  );
}
