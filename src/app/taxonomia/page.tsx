"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderTree, Tags, ClipboardCheck } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { useCompany } from "@/components/company-context";
import { TaxonomiaView } from "@/features/taxonomia/components/TaxonomiaView";
import { ProductTypesView } from "@/features/product-types/components/ProductTypesView";
import { AuditoriasView } from "@/features/auditorias/components/AuditoriasView";

type TaxonomiaTab = "arbol" | "tipologias" | "auditoria";

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
