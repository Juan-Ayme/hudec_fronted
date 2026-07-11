"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Database,
  History,
  ListChecks,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { num, dateTime } from "@/lib/format";
import { humanizeError } from "@/lib/sync-i18n";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { HealthBanner } from "@/components/sync/health-banner";
import { ActiveMonitor } from "@/components/sync/active-monitor";
import { EntityGrid } from "@/components/sync/entity-grid";
import { ActivityFeed } from "@/components/sync/activity-feed";
import { ErrorPanel } from "@/components/sync/error-panel";

import { useSync } from "../hooks/useSync";
import { ActionCard } from "./ActionCard";
import { Toggle } from "./Toggle";
import { MiniStat } from "./MiniStat";
import { TaskList } from "./TaskList";
import { DataQualityList } from "./DataQualityList";

export function SyncView() {
  const {
    days,
    setDays,
    skipDocs,
    setSkipDocs,
    skipStock,
    setSkipStock,
    incrMsg,
    tasks,
    activeTask,
    log,
    hasActiveRun,
    dq,
    incrMut,
    fullMut,
    stats,
  } = useSync();

  return (
    <div>
      <PageHeader
        eyebrow="Sincronización en tiempo real"
        title="Sync con BSale"
        description="Dispara descargas de catálogo, ventas y stock. Sigue cada fase con detalle: qué se descarga, qué se inserta y dónde falla."
      />

      {/* ── 1) Health/Conexión ── */}
      <HealthBanner />

      {/* ── 2) Acciones rápidas ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Incremental */}
        <ActionCard
          tone="primary"
          icon={<Zap className="h-5 w-5" />}
          title="Sync incremental"
          subtitle="Refresca catálogo (tipos + productos + variantes) en segundos."
          meta={[
            { label: "Duración aprox.", value: "< 30 s" },
            { label: "Modifica", value: "Catálogo" },
          ]}
          action={
            <Button onClick={() => incrMut.mutate()} loading={incrMut.isPending}>
              <Zap className="h-4 w-4" /> Ejecutar ahora
            </Button>
          }
          message={incrMsg}
        />

        {/* Full */}
        <ActionCard
          tone="violet"
          icon={<RefreshCw className="h-5 w-5" />}
          title="Sync completa"
          subtitle="Descarga ventana de documentos, stock y costos. Corre en segundo plano."
          meta={[
            { label: "Duración aprox.", value: "1 – 15 min" },
            {
              label: "Fases",
              value: `${10 - (skipDocs ? 2 : 0) - (skipStock ? 1 : 0)} entidades`,
            },
          ]}
          action={
            <div className="space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <Field label="Días hacia atrás">
                  <Input
                    type="number"
                    min={1}
                    max={3650}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value) || 1)}
                    className="w-24"
                  />
                </Field>
                <Toggle
                  label="Omitir documentos"
                  checked={skipDocs}
                  onChange={setSkipDocs}
                />
                <Toggle
                  label="Omitir snapshot de stock"
                  checked={skipStock}
                  onChange={setSkipStock}
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => fullMut.mutate()}
                loading={fullMut.isPending}
              >
                <RefreshCw className="h-4 w-4" /> Encolar sync completa
              </Button>
              {fullMut.isSuccess && (
                <p className="rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-xs text-success">
                  Encolada con éxito · tarea{" "}
                  <span className="font-mono">{fullMut.data?.task_id}</span>
                </p>
              )}
              {fullMut.isError && (
                <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
                  {humanizeError((fullMut.error as Error).message)}
                </p>
              )}
            </div>
          }
        />
      </div>

      {/* ── 3) Monitor activo (task API o sync por CLI) ── */}
      {hasActiveRun && (
        <div className="mt-4">
          <ActiveMonitor task={activeTask} log={log.data ?? []} />
        </div>
      )}

      {/* ── 3.5) Panel de errores (siempre visible si hay errores) ── */}
      <div className="mt-4">
        <Card>
          <CardHeader
            title="Diagnóstico de errores"
            subtitle="Qué fases fallaron en la última sincronización y por qué."
            action={
              <Badge tone={stats.errCount > 0 ? "danger" : "success"}>
                <AlertTriangle className="h-3 w-3" /> {num(stats.errCount)}
              </Badge>
            }
          />
          <CardBody>
            <ErrorPanel log={log.data} />
          </CardBody>
        </Card>
      </div>

      {/* ── 4) Resumen de logs ── */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Fases OK (últimas 80)"
          value={num(stats.okCount)}
          tone="success"
        />
        <MiniStat
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Fases con error"
          value={num(stats.errCount)}
          tone={stats.errCount > 0 ? "danger" : "neutral"}
        />
        <MiniStat
          icon={<Sparkles className="h-4 w-4" />}
          label="Fases en curso"
          value={num(stats.runCount)}
          tone={stats.runCount > 0 ? "info" : "neutral"}
        />
        <MiniStat
          icon={<History className="h-4 w-4" />}
          label="Última sincronización"
          value={stats.last ? dateTime(stats.last) : "—"}
          tone="primary"
          mono={false}
        />
      </div>

      {/* ── 5) Grid de entidades ── */}
      <Card className="mt-4">
        <CardHeader
          title="Entidades sincronizables"
          subtitle="Un vistazo a todo lo que viaja desde BSale hacia tu base de datos."
          action={
            <Badge tone="info">
              <Database className="h-3 w-3" /> en vivo
            </Badge>
          }
        />
        <CardBody>
          <EntityGrid log={log.data} />
        </CardBody>
      </Card>

      {/* ── 6) Tareas + feed lado a lado ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Tareas de la sesión"
            subtitle="Sync disparadas desde esta pestaña"
            action={
              <Badge tone="primary">
                <ListChecks className="h-3 w-3" /> {num(tasks.data?.length ?? 0)}
              </Badge>
            }
          />
          <CardBody className="space-y-2">
            <TaskList tasks={tasks.data ?? []} loading={tasks.isLoading} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Actividad en tiempo real"
            subtitle="Cada fase del log, traducida a humano"
            action={
              hasActiveRun ? (
                <Badge tone="info" dot>
                  Polling cada 2.5s
                </Badge>
              ) : (
                <Badge tone="neutral">Inactivo</Badge>
              )
            }
          />
          <CardBody>
            <div className="max-h-[560px] overflow-y-auto pr-1">
              <ActivityFeed
                log={log.data}
                isLoading={log.isLoading}
                limit={40}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── 7) Calidad de datos ── */}
      <Card className="mt-4">
        <CardHeader
          title="Incidencias de calidad"
          subtitle="Problemas detectados por el sync (productos sin campos, precios negativos, etc.)"
          action={
            <Badge tone={(dq.data?.length ?? 0) > 0 ? "warning" : "success"}>
              <ShieldAlert className="h-3 w-3" /> {num(dq.data?.length ?? 0)}
            </Badge>
          }
        />
        <CardBody>
          <DataQualityList
            issues={dq.data ?? []}
            loading={dq.isLoading}
            error={dq.error}
          />
        </CardBody>
      </Card>
    </div>
  );
}
