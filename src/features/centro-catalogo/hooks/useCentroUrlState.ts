"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Selection } from "@/lib/types";
import type { MainTab } from "../types";

/**
 * Estado pestaña + selección en la URL (?tab, dept, cat, subcat).
 * La URL es la fuente de verdad — sin state local ni useEffect que la
 * sincronice (mismo patrón que /configuracion). `router.replace` para que
 * navegar el árbol no ensucie el historial; `scroll: false`.
 */
export function useCentroUrlState(canVerRendimiento: boolean) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // viewer (o rol aún sin resolver): siempre la pestaña de compras, aunque
  // el deep link diga otra cosa. `?tab=<basura>` degrada al default.
  const rawTab = searchParams.get("tab");
  const tab: MainTab = !canVerRendimiento
    ? "compras"
    : rawTab === "compras"
      ? "compras"
      : "rendimiento";

  const selection = useMemo<Selection>(() => {
    // Guard jerárquico: cat requiere dept; subcat requiere cat.
    const dept = searchParams.get("dept");
    const cat = dept ? searchParams.get("cat") : null;
    const subcat = cat ? searchParams.get("subcat") : null;
    return { dept, cat, subcat };
  }, [searchParams]);

  const update = (patch: { tab?: MainTab; selection?: Selection }) => {
    const params = new URLSearchParams(searchParams);
    const nextTab = patch.tab ?? tab;
    if (nextTab === "compras") params.set("tab", "compras");
    else params.delete("tab"); // rendimiento es el default → URL limpia
    const sel = patch.selection ?? selection;
    for (const [key, value] of [
      ["dept", sel.dept],
      ["cat", sel.cat],
      ["subcat", sel.subcat],
    ] as const) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return {
    tab,
    selection,
    setTab: (t: MainTab) => update({ tab: t }),
    setSelection: (s: Selection) => update({ selection: s }),
  };
}
