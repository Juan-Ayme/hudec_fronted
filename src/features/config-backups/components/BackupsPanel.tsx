"use client";

import { useState } from "react";
import {
  RotateCcw,
  Download,
  Trash2,
  Tag,
  Upload,
} from "lucide-react";
import {
  exportConfig,
  type ConfigBackup,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { useBackups } from "../hooks/useBackups";

const BACKUP_KEY_LABELS: Record<string, string> = {
  excluded_departments: "Departamentos excluidos",
  excluded_categories: "Categorías excluidas",
  seasonal_departments: "Departamentos estacionales",
  thresholds: "Umbrales",
  company: "Empresa (marca + IDs BSale)",
  sales_goals: "Metas de venta",
};

export function BackupsPanel() {
  const {
    filterKey,
    setFilterKey,
    backups,
    snapshotMut,
    restoreMut,
    deleteMut,
    importMut,
  } = useBackups();
  const [manualLabel, setManualLabel] = useState<string>("");

  const handleExport = async () => {
    const data = await exportConfig();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = data.exported_at.replace(/[:.]/g, "-").slice(0, 19);
    a.download = `kawii-config-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      const config =
        parsed && typeof parsed === "object" && "config" in parsed
          ? (parsed.config as Record<string, unknown>)
          : (parsed as Record<string, unknown>);
      if (!confirm(`¿Aplicar configuración del archivo "${file.name}"? Se hará snapshot de seguridad antes de pisar.`))
        return;
      importMut.mutate({ config, label: `import: ${file.name}` });
    } catch (err) {
      alert(`Error parseando JSON: ${(err as Error).message}`);
    }
  };

  if (backups.isError) return <ErrorState error={backups.error} />;
  if (backups.isLoading || !backups.data)
    return <LoadingState label="Cargando historial de configuración…" />;

  return (
    <div className="space-y-4">
      {/* Acciones globales */}
      <Card>
        <CardHeader
          title="Snapshot manual + Export / Import"
          subtitle="Marcá puntos importantes para volver fácil. Descargá un JSON para tener respaldo afuera de la DB."
        />
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-1 min-w-[200px] flex-col gap-1">
              <span className="text-caption font-semibold uppercase tracking-[0.08em] text-muted">
                Etiqueta del snapshot
              </span>
              <Input
                type="text"
                placeholder='ej. "checkpoint estable" o "antes de campaña Q4"'
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
              />
            </label>
            <Button
              onClick={() =>
                snapshotMut.mutate(manualLabel.trim(), {
                  onSuccess: () => setManualLabel(""),
                })
              }
              disabled={!manualLabel.trim() || snapshotMut.isPending}
              title="Guarda el estado actual de TODAS las configuraciones con esta etiqueta"
            >
              <Tag className="h-4 w-4" />
              {snapshotMut.isPending ? "Guardando…" : "Crear snapshot"}
            </Button>
            <Button onClick={handleExport} variant="secondary">
              <Download className="h-4 w-4" /> Exportar JSON
            </Button>
            <label
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border-soft bg-surface-2 px-3 py-1.5 text-sm font-semibold text-fg",
                "transition-colors hover:bg-surface-3",
              )}
            >
              <Upload className="h-4 w-4" /> Importar JSON
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-faint">
            Cada cambio en /configuracion ya crea un snapshot automático. Estos
            botones son para marcar momentos importantes o tener un respaldo
            fuera de la base de datos.
          </p>
        </CardBody>
      </Card>

      {/* Filtro + Historial */}
      <Card>
        <CardHeader
          title="Historial"
          subtitle={`${backups.data.total} snapshot(s). Manuales nunca se borran; automáticos se retienen los últimos 50 por sección.`}
          action={
            <select
              value={filterKey}
              onChange={(e) => setFilterKey(e.target.value)}
              className="h-9 rounded-md border border-border-soft bg-surface-2 px-3 text-sm text-fg"
            >
              <option value="">Todas las secciones</option>
              {Object.entries(BACKUP_KEY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          }
        />
        <CardBody>
          {backups.data.backups.length === 0 ? (
            <p className="py-8 text-center text-sm text-faint">
              Sin snapshots todavía. Hacé un cambio en cualquier tab o creá un
              snapshot manual para empezar el historial.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/50">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-surface-2 text-[10px] font-bold uppercase tracking-wider text-faint">
                    <th className="py-2 pl-3 text-left">Fecha</th>
                    <th className="py-2 px-2 text-left">Sección</th>
                    <th className="py-2 px-2 text-left">Origen</th>
                    <th className="py-2 px-2 text-left">Etiqueta</th>
                    <th className="py-2 pr-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.data.backups.map((b) => (
                    <BackupRow
                      key={b.id}
                      backup={b}
                      onRestore={() => {
                        if (
                          confirm(
                            `¿Restaurar ${BACKUP_KEY_LABELS[b.config_key] ?? b.config_key} al estado del ${new Date(b.changed_at).toLocaleString()}? El estado actual quedará guardado como snapshot para poder revertir.`,
                          )
                        )
                          restoreMut.mutate(b.id);
                      }}
                      onDelete={() => {
                        if (
                          confirm(
                            `¿Borrar este snapshot histórico definitivamente?`,
                          )
                        )
                          deleteMut.mutate(b.id);
                      }}
                      busy={restoreMut.isPending || deleteMut.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function BackupRow({
  backup,
  onRestore,
  onDelete,
  busy,
}: {
  backup: ConfigBackup;
  onRestore: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const niceKey = BACKUP_KEY_LABELS[backup.config_key] ?? backup.config_key;
  return (
    <tr className="border-b border-border/20 hover:bg-surface-2/40">
      <td className="py-2 pl-3 align-top text-fg whitespace-nowrap">
        {new Date(backup.changed_at).toLocaleString()}
      </td>
      <td className="py-2 px-2 align-top text-fg">{niceKey}</td>
      <td className="py-2 px-2 align-top text-faint text-xs">
        {backup.is_manual ? (
          <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[0.62rem] font-semibold text-primary">
            <Tag className="h-3 w-3" /> Manual
          </span>
        ) : (
          <span>{backup.source ?? "auto"}</span>
        )}
      </td>
      <td className="py-2 px-2 align-top text-fg text-xs">
        {backup.label ?? "—"}
        {!backup.has_value && (
          <span className="ml-1 text-[0.62rem] text-warning">
            (estado vacío)
          </span>
        )}
      </td>
      <td className="py-2 pr-3 align-top text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onRestore}
            disabled={busy}
            title="Volver a este estado"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={busy}
            title="Borrar este snapshot del historial"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
