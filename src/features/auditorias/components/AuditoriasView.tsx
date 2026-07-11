"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import { useAuditorias } from "../hooks/useAuditorias";
import { ISSUE_LABELS, FALLBACK_META } from "../lib";
import { AuditoriasSkeleton } from "./AuditoriasSkeleton";
import { SeverityBanner } from "./SeverityBanner";
import { OriginCard } from "./OriginCard";
import { IssueSummaryGrid } from "./IssueSummaryGrid";
import { AutoFixNamingCard } from "./AutoFixNamingCard";
import { IssueSection } from "./IssueSection";
import { OrphansCard } from "./OrphansCard";

export function AuditoriasView() {
  const {
    audits,
    orphans,
    expanded,
    setExpanded,
    fixResult,
    fixMut,
    byOrigin,
  } = useAuditorias();

  const data = audits.data;

  return (
    <div>
      <PageHeader
        title="Auditorías"
        description="Calidad del catálogo: detecta inconsistencias y te dice exactamente dónde nacen — en BSale, en tu BD local, o en ambos."
        actions={
          <Button
            variant="secondary"
            onClick={() => audits.refetch()}
            loading={audits.isFetching}
          >
            Re-ejecutar
          </Button>
        }
      />

      {audits.isLoading ? (
        <AuditoriasSkeleton />
      ) : audits.error ? (
        <ErrorState error={audits.error} />
      ) : data ? (
        <>
          {/* Banner de severidad */}
          <SeverityBanner
            severity={data.severity}
            generatedAt={data.generated_at}
          />

          {/* KPI cards POR ORIGEN — responden de un vistazo "¿dónde está el problema?" */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <OriginCard source="bsale" count={byOrigin.bsale} />
            <OriginCard source="local_db" count={byOrigin.local_db} />
            <OriginCard source="both" count={byOrigin.both} />
          </div>

          {/* Resumen de conteos por tipo */}
          <IssueSummaryGrid summary={data.summary} meta={data.meta} />

          {/* Auto-fix de nombres */}
          <AutoFixNamingCard
            fixResult={fixResult}
            namingMismatches={data.summary.naming_mismatches}
            onPreview={() => fixMut.mutate(true)}
            onApply={() => fixMut.mutate(false)}
            previewLoading={fixMut.isPending && fixMut.variables === true}
            applyLoading={fixMut.isPending && fixMut.variables === false}
          />

          {/* Listas de issues — cada sección con origen, descripción, impacto, fix */}
          <div className="mt-4 space-y-2">
            {Object.entries(data.issues).map(([key, items]) => (
              <IssueSection
                key={key}
                issueKey={key}
                title={ISSUE_LABELS[key] ?? key}
                items={items}
                meta={data.meta?.[key] ?? FALLBACK_META}
                open={expanded === key}
                onToggle={() => setExpanded(expanded === key ? null : key)}
              />
            ))}
          </div>

          {/* Huérfanos sin productos */}
          <OrphansCard orphans={orphans} />
        </>
      ) : null}
    </div>
  );
}
