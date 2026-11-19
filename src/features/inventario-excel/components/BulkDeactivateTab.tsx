"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Play,
  RotateCcw,
  ClipboardPaste,
  AlertTriangle,
  HelpCircle,
  AlertCircle,
  Boxes,
  Zap,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useBulkDeactivate } from "../hooks/useBulkDeactivate";
import { useCompany } from "@/components/company-context";
import { cn } from "@/lib/utils";

type FilterView =
  | "all"
  | "to_deactivate"
  | "blocked"
  | "inactive"
  | "not_found"
  | "failed";

export function BulkDeactivateTab() {
  const {
    rawInput,
    setRawInput,
    parsedSkus,
    forzarConStock,
    setForzarConStock,
    isSimulating,
    isExecuting,
    result,
    error,
    simulate,
    execute,
    resetAll,
  } = useBulkDeactivate();

  const { activeRole } = useCompany();
  const isAdmin = activeRole === "admin";

  const [activeFilter, setActiveFilter] = useState<FilterView>("all");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Extracción segura que soporta tanto dry_run: true (to_deactivate) como dry_run: false (deactivated)
  const itemsToDeactivate = result?.deactivated ?? result?.to_deactivate ?? [];
  const itemsBlocked = result?.blocked_by_stock ?? [];
  const itemsInactive = result?.already_inactive ?? [];
  const itemsNotFound = result?.not_found ?? [];
  const itemsFailed = result?.failed ?? [];

  const countToDeactivate =
    result?.totals?.deactivated ??
    result?.totals?.to_deactivate ??
    itemsToDeactivate.length;
  const countBlocked =
    result?.totals?.blocked_by_stock ?? itemsBlocked.length;
  const countInactive =
    result?.totals?.already_inactive ?? itemsInactive.length;
  const countNotFound = result?.totals?.not_found ?? itemsNotFound.length;
  const countFailed = result?.totals?.failed ?? itemsFailed.length;
  const countReceived = result?.totals?.received ?? 0;

  // Productos padre que se archivarán (dry_run: true) o ya archivados (dry_run: false)
  const parentsToDeactivate = result?.totals?.parent_products_to_deactivate ?? 0;
  const parentsDeactivated = result?.totals?.parent_products_deactivated ?? 0;
  const parentsCount = result?.dry_run ? parentsToDeactivate : parentsDeactivated;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawInput((prev) => (prev ? `${prev}\n${text}` : text));
      }
    } catch {
      // Si el navegador bloquea el permiso de clipboard
    }
  };

  const handleExecuteConfirmed = async () => {
    setConfirmModalOpen(false);
    setActiveFilter("all");
    await execute();
  };

  const handleSimulate = async () => {
    setActiveFilter("all");
    await simulate();
  };

  const handleReset = () => {
    setActiveFilter("all");
    resetAll();
  };

  const visibleCount =
    activeFilter === "all"
      ? itemsToDeactivate.length +
        itemsBlocked.length +
        itemsInactive.length +
        itemsNotFound.length +
        itemsFailed.length
      : activeFilter === "to_deactivate"
        ? itemsToDeactivate.length
        : activeFilter === "blocked"
          ? itemsBlocked.length
          : activeFilter === "inactive"
            ? itemsInactive.length
            : activeFilter === "not_found"
              ? itemsNotFound.length
              : itemsFailed.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── LEFT: Form Panel (Input + Opciones + Acciones) ── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Textarea card */}
          <Card>
            <CardHeader
              eyebrow="Entrada de SKUs"
              title={
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-primary" />
                    Lista de Productos
                  </span>
                  <Badge tone={parsedSkus.length > 0 ? "primary" : "neutral"}>
                    {parsedSkus.length}{" "}
                    {parsedSkus.length === 1 ? "código" : "códigos"}
                  </Badge>
                </div>
              }
              action={
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePasteClipboard}
                    title="Pegar desde el portapapeles"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    Pegar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={!rawInput && !result}
                    title="Limpiar entrada y resultados"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpiar
                  </Button>
                </div>
              }
            />
            <CardBody className="space-y-3">
              <p className="text-caption text-muted">
                Pega los SKUs o códigos de barra copiados desde Excel (uno por
                línea o separados por coma).
              </p>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={9}
                placeholder="SKU-001&#10;SKU-002&#10;7751234567890&#10;..."
                className={cn(
                  "w-full rounded-xl border border-white/[0.08] bg-surface-2 p-3.5 font-mono text-sm text-fg",
                  "placeholder:text-faint/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40",
                  "transition-colors duration-200 resize-none",
                )}
              />

              {/* Toggle de seguridad: forzar_con_stock */}
              <div className="pt-2 border-t border-white/[0.04]">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={forzarConStock}
                      onChange={(e) => setForzarConStock(e.target.checked)}
                    />
                    <div
                      className={cn(
                        "h-5 w-9 rounded-full transition-all duration-300",
                        "border border-white/10",
                        forzarConStock
                          ? "bg-warning shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                          : "bg-surface-3",
                      )}
                    />
                    <div
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
                        forzarConStock ? "left-[18px]" : "left-0.5",
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-body text-fg font-medium group-hover:text-warning transition-colors">
                      Forzar desactivación con stock
                    </p>
                    <p className="text-caption text-faint">
                      Por defecto, el sistema bloquea y protege productos con
                      unidades físicas (&gt; 0) en sucursales.
                    </p>
                  </div>
                </label>

                {forzarConStock && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-caption text-warning animate-fade-in">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Advertencia de Stock:</strong> Se desactivarán las
                      variantes en BSale aunque tengan inventario disponible.
                    </span>
                  </div>
                )}
              </div>

              {/* Alerta si el rol no es administrador */}
              {!isAdmin && (
                <div className="flex items-center gap-2.5 rounded-lg border border-warning/25 bg-warning/[0.06] p-2.5 text-caption text-warning">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>
                    Rol activo: <strong>{activeRole ?? "viewer"}</strong>. Puedes realizar simulaciones (Dry Run). Para ejecutar la baja real en BSale/BD se requiere rol <strong>Administrador</strong>.
                  </span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <Button
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  loading={isSimulating}
                  disabled={parsedSkus.length === 0 || isExecuting}
                  onClick={handleSimulate}
                >
                  <Play className="h-4 w-4 text-primary" />
                  {isSimulating ? "Simulando…" : "Simular (Dry Run)"}
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  className="flex-1"
                  loading={isExecuting}
                  disabled={parsedSkus.length === 0 || isSimulating || !isAdmin}
                  title={!isAdmin ? "Requiere permisos de Administrador" : undefined}
                  onClick={() => setConfirmModalOpen(true)}
                >
                  {isAdmin ? <Zap className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isExecuting ? "Ejecutando…" : "Ejecutar Baja"}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Card explicativa de seguridad */}
          <Card className="border-white/[0.04] bg-surface/[0.4]">
            <CardBody className="space-y-2.5">
              <div className="flex items-center gap-2 text-caption font-semibold text-fg">
                <ShieldAlert className="h-4 w-4 text-accent" />
                Doble Persistencia Coordinada
              </div>
              <p className="text-caption text-muted leading-relaxed">
                Al ejecutar, el endpoint contacta directamente la API oficial de
                BSale (<code className="font-mono text-primary">DELETE /v1/variants/&#123;id&#125;.json</code>)
                para evitar que el sincronizador nocturno reviva el producto, y
                actualiza PostgreSQL (<code className="font-mono text-fg">is_active = FALSE</code>).
              </p>
              <p className="text-caption text-faint">
                Si todas las variantes de un producto quedan inactivas, el producto
                padre también se desactiva automáticamente en cascada.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* ── RIGHT: Results & Audit Panel ── */}
        <div className="lg:col-span-7 space-y-5">
          {error && (
            <Card className="border-danger/20 animate-fade-in">
              <CardBody>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="text-body font-semibold text-fg">
                      Error en la operación
                    </p>
                    <p className="text-caption text-danger/90 mt-1">{error}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {!result && !error && (
            <Card className="overflow-hidden">
              <CardBody className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <HelpCircle className="h-8 w-8 text-faint" />
                </div>
                <h4 className="text-h3 font-semibold text-fg">
                  Sin simulación activa
                </h4>
                <p className="text-body text-muted max-w-sm mx-auto mt-2">
                  Ingresa una lista de SKUs a la izquierda y presiona{" "}
                  <strong className="text-fg">Simular (Dry Run)</strong> para ver
                  el análisis de stock y saber qué pasará sin afectar la BD.
                </p>
              </CardBody>
            </Card>
          )}

          {result && (
            <div className="space-y-4 animate-fade-in">
              {/* Header de estado del resultado */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-white/[0.06] bg-surface-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  {result.dry_run ? (
                    <Badge tone="info" dot>
                      Modo Simulación (Dry Run)
                    </Badge>
                  ) : (
                    <Badge tone="success" dot>
                      Ejecución Aplicada en BSale y BD
                    </Badge>
                  )}
                  {result.forzar_con_stock && (
                    <Badge tone="warning">Forzado con stock</Badge>
                  )}
                  {parentsCount > 0 && (
                    <Badge tone="violet">
                      📦 {parentsCount} {result.dry_run ? "productos completos se archivarán" : "productos completos archivados"}
                    </Badge>
                  )}
                </div>
                <p className="text-caption text-muted">
                  Total ingresados:{" "}
                  <strong className="text-fg">{countReceived}</strong>
                </p>
              </div>

              {/* Banner destacado si hay productos padre que se archivarán por completo */}
              {parentsToDeactivate > 0 && result.dry_run && (
                <div className="flex items-start gap-3 rounded-xl border border-violet/30 bg-violet/[0.06] p-3.5 text-caption text-violet animate-fade-in">
                  <span className="text-lg">📦</span>
                  <div>
                    <p className="font-semibold text-fg">
                      {parentsToDeactivate} {parentsToDeactivate === 1 ? "producto completo se archivará" : "productos completos se archivarán"}
                    </p>
                    <p className="text-muted mt-0.5">
                      Al desactivar todas sus variantes, el producto padre también quedará automáticamente inactivo en la base de datos y BSale.
                    </p>
                  </div>
                </div>
              )}

              {/* Tarjetas KPI de Totales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-success/20 bg-success/[0.04] p-3 text-center">
                  <p className="text-[0.7rem] font-semibold uppercase text-success/80">
                    {result.dry_run ? "A Desactivar" : "Desactivados"}
                  </p>
                  <p className="text-h2 font-heading font-bold text-success mt-1">
                    {countToDeactivate}
                  </p>
                  <p className="text-[0.7rem] text-faint mt-0.5">
                    {result.dry_run ? "Stock 0.0" : "En BSale y BD"}
                  </p>
                </div>

                <div className="rounded-xl border border-warning/20 bg-warning/[0.04] p-3 text-center">
                  <p className="text-[0.7rem] font-semibold uppercase text-warning/80">
                    Bloqueados Stock
                  </p>
                  <p className="text-h2 font-heading font-bold text-warning mt-1">
                    {countBlocked}
                  </p>
                  <p className="text-[0.7rem] text-faint mt-0.5">Con unidades</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-surface-2 p-3 text-center">
                  <p className="text-[0.7rem] font-semibold uppercase text-muted">
                    Ya Inactivos
                  </p>
                  <p className="text-h2 font-heading font-bold text-fg mt-1">
                    {countInactive}
                  </p>
                  <p className="text-[0.7rem] text-faint mt-0.5">Sin cambios</p>
                </div>

                <div className="rounded-xl border border-danger/20 bg-danger/[0.04] p-3 text-center">
                  <p className="text-[0.7rem] font-semibold uppercase text-danger/80">
                    No Encontrados
                  </p>
                  <p className="text-h2 font-heading font-bold text-danger mt-1">
                    {countNotFound}
                  </p>
                  <p className="text-[0.7rem] text-faint mt-0.5">En catálogo</p>
                </div>
              </div>

              {/* Filtro por sub-lista y tabla */}
              <Card>
                <CardHeader
                  eyebrow="Auditoría"
                  title="Detalle de Variantes"
                  action={
                    <div className="flex flex-wrap gap-1">
                      <FilterButton
                        active={activeFilter === "all"}
                        onClick={() => setActiveFilter("all")}
                        label="Todos"
                        count={countReceived}
                      />
                      <FilterButton
                        active={activeFilter === "to_deactivate"}
                        onClick={() => setActiveFilter("to_deactivate")}
                        label={result.dry_run ? "A Desactivar" : "Desactivados"}
                        count={countToDeactivate}
                        tone="success"
                      />
                      <FilterButton
                        active={activeFilter === "blocked"}
                        onClick={() => setActiveFilter("blocked")}
                        label="Bloqueados"
                        count={countBlocked}
                        tone="warning"
                      />
                      <FilterButton
                        active={activeFilter === "inactive"}
                        onClick={() => setActiveFilter("inactive")}
                        label="Inactivos"
                        count={countInactive}
                      />
                      <FilterButton
                        active={activeFilter === "not_found"}
                        onClick={() => setActiveFilter("not_found")}
                        label="No hallados"
                        count={countNotFound}
                        tone="danger"
                      />
                      {countFailed > 0 && (
                        <FilterButton
                          active={activeFilter === "failed"}
                          onClick={() => setActiveFilter("failed")}
                          label="Fallidos"
                          count={countFailed}
                          tone="danger"
                        />
                      )}
                    </div>
                  }
                />
                <CardBody className="p-0">
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.04]">
                    {/* Items a desactivar / desactivados */}
                    {(activeFilter === "all" || activeFilter === "to_deactivate") &&
                      itemsToDeactivate.map((item, idx) => (
                        <div
                          key={`to_deact_${item.code}_${idx}`}
                          className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-fg">
                                {item.code}
                              </span>
                              <Badge tone="success">
                                {result.dry_run ? "Por desactivar" : "Desactivado"}
                              </Badge>
                            </div>
                            <p className="text-caption text-muted">
                              {item.product_name ?? "Producto sin nombre"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-caption font-mono text-muted">
                              Stock: {item.stock ?? 0}
                            </span>
                          </div>
                        </div>
                      ))}

                    {/* Items bloqueados por stock */}
                    {(activeFilter === "all" || activeFilter === "blocked") &&
                      itemsBlocked.map((item, idx) => (
                        <div
                          key={`blocked_${item.code}_${idx}`}
                          className="flex items-center justify-between p-3.5 bg-warning/[0.02] hover:bg-warning/[0.04] transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-fg">
                                {item.code}
                              </span>
                              <Badge tone="warning">Bloqueado por Stock</Badge>
                            </div>
                            <p className="text-caption text-muted">
                              {item.product_name ?? "Producto sin nombre"}
                            </p>
                            {item.reason && (
                              <p className="text-caption text-warning/90 mt-0.5">
                                {item.reason}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-body font-mono font-bold text-warning">
                              {item.stock} u.
                            </span>
                          </div>
                        </div>
                      ))}

                    {/* Items ya inactivos */}
                    {(activeFilter === "all" || activeFilter === "inactive") &&
                      itemsInactive.map((item, idx) => {
                        const code = typeof item === "string" ? item : item.code;
                        const name = typeof item === "string" ? null : item.product_name;
                        return (
                          <div
                            key={`inactive_${code}_${idx}`}
                            className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-faint">
                                  {code}
                                </span>
                                <Badge tone="neutral">Ya inactivo</Badge>
                              </div>
                              {name && (
                                <p className="text-caption text-faint mt-0.5">
                                  {name}
                                </p>
                              )}
                            </div>
                            <span className="text-caption text-faint">—</span>
                          </div>
                        );
                      })}

                    {/* Items no encontrados */}
                    {(activeFilter === "all" || activeFilter === "not_found") &&
                      itemsNotFound.map((code, idx) => (
                        <div
                          key={`notfound_${code}_${idx}`}
                          className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-danger/80">
                              {code}
                            </span>
                            <Badge tone="danger">No encontrado</Badge>
                          </div>
                          <span className="text-caption text-faint">
                            No existe en catálogo
                          </span>
                        </div>
                      ))}

                    {/* Items fallidos */}
                    {(activeFilter === "all" || activeFilter === "failed") &&
                      itemsFailed.map((item, idx) => (
                        <div
                          key={`failed_${item.code}_${idx}`}
                          className="flex items-center justify-between p-3.5 bg-danger/[0.02] hover:bg-danger/[0.04] transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-danger">
                                {item.code}
                              </span>
                              <Badge tone="danger">Error en BSale</Badge>
                            </div>
                            <p className="text-caption text-danger/90">
                              {item.error ?? "Fallo al comunicar con BSale"}
                            </p>
                          </div>
                        </div>
                      ))}

                    {visibleCount === 0 && (
                      <div className="p-8 text-center text-caption text-muted">
                        No hay elementos que mostrar para este filtro.
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para Ejecutar Desactivación Definitiva */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirmar Desactivación Masiva"
        description="Esta acción modificará el catálogo en tiempo real."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleExecuteConfirmed}
              loading={isExecuting}
            >
              <Zap className="h-4 w-4" />
              Confirmar y Desactivar
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2 text-body">
          <p className="text-fg">
            Estás a punto de desactivar{" "}
            <strong className="text-danger font-bold">
              {parsedSkus.length}
            </strong>{" "}
            productos/códigos.
          </p>
          <ul className="text-caption text-muted list-disc list-inside space-y-1">
            <li>Se llamará al endpoint de eliminación en BSale.</li>
            <li>Se marcará <code className="font-mono text-fg">is_active = false</code> en la base de datos interna.</li>
            <li>Se invalidará la caché de las matrices de compras y ventas.</li>
            {forzarConStock && (
              <li className="text-warning font-semibold">
                ⚠️ Atención: Has activado &quot;Forzar con stock&quot;, por lo que los productos con unidades físicas también serán desactivados.
              </li>
            )}
          </ul>
        </div>
      </Dialog>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
  tone = "neutral",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-lg text-caption font-medium transition-colors flex items-center gap-1.5",
        active
          ? "bg-surface-3 text-fg border border-white/10"
          : "text-muted hover:text-fg hover:bg-white/[0.03]",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.2 text-[0.65rem] font-bold",
          tone === "success" && "bg-success/20 text-success",
          tone === "warning" && "bg-warning/20 text-warning",
          tone === "danger" && "bg-danger/20 text-danger",
          tone === "neutral" && "bg-white/10 text-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}
