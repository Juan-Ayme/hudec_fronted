"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, ShoppingBag } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { EcosistemaView } from "@/features/ecosistema/components/EcosistemaView";
import { ComprasHistoricoView } from "@/features/ecosistema/components/ComprasHistoricoView";

type ComprasTab = "ecosistema" | "historico";

const COMPRAS_TABS: TabItem<ComprasTab>[] = [
  { id: "ecosistema", label: "Ecosistema (Compra vs Venta)", icon: ArrowLeftRight },
  { id: "historico", label: "Reporte Histórico Excel", icon: ShoppingBag },
];

function ComprasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: ComprasTab =
    COMPRAS_TABS.some((i) => i.id === rawTab) ? (rawTab as ComprasTab) : "ecosistema";

  const changeTab = (next: ComprasTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    router.replace(`/compras-ecosistema?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <Tabs items={COMPRAS_TABS} value={tab} onChange={changeTab} />
      {tab === "ecosistema" && <EcosistemaView />}
      {tab === "historico" && <ComprasHistoricoView />}
    </div>
  );
}

export default function ComprasEcosistemaPage() {
  return (
    <Suspense fallback={null}>
      <ComprasContent />
    </Suspense>
  );
}
