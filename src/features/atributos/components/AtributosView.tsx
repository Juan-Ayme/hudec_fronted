"use client";

import { useId } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { yaAvisado } from "@/lib/api";
import { bajarPlantillaDriver, type ImportDriverResult } from "@/lib/atributos-api";
import { num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAtributos } from "../hooks/useAtributos";

/** De dónde vino cada dato (columna `source` de product_attrs). */
const FUENTES: Record<string, { label: string; tone: "neutral" | "info" | "success" }> = {
  inferred: { label: "Adivinado del nombre", tone: "neutral" },
  driver: { label: "Excel", tone: "info" },
  manual: { label: "A mano", tone: "success" },
};

const MAX_FILAS = 50;

export function AtributosView() {
  const { defs, cobertura, archivo, elegirArchivo, prueba, cargado, probar, cargar } =
    useAtributos();
  const inputId = useId();

  const nombres: Record<string, string> = { proveedor: "Proveedor" };
  for (const d of defs.data?.definitions ?? []) nombres[d.code] = d.name;
  const nombre = (code: string) => nombres[code] ?? code;

  const descargar = async () => {
    try {
      await bajarPlantillaDriver();
    } catch (e) {
      if (!yaAvisado(e)) throw e;
    }
  };

  const hayQueCargar =
    !!prueba &&
    prueba.stats.emparejadas > 0 &&
    (Object.values(prueba.atributos_por_codigo).some((n) => n > 0) ||
      prueba.stats.relaciones_proveedor > 0);

  return (
    <div className="space-y-4">
      {/* ── Estado actual ───────────────────────────────────────────── */}
      <Card>
        <CardHeader
          eyebrow="Productos activos"
          title="Qué datos tienen hoy los productos"
          subtitle="Marca, licencia, público, etc. Los que dicen “Adivinado del nombre” los sacó el sistema leyendo el nombre del producto: conviene revisarlos con el Excel."
        />
        {cobertura.isError ? (
          <CardBody>
            <ErrorState error={cobertura.error} />
          </CardBody>
        ) : cobertura.isLoading || !cobertura.data ? (
          <CardBody>
            <LoadingState label="Cargando atributos…" />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-caption">
              <thead className="bg-surface-2/95">
                <tr className="border-b border-border-soft text-[0.65rem] uppercase tracking-wider text-faint">
                  <th className="px-4 py-2 text-left font-semibold">Dato</th>
                  <th className="px-4 py-2 text-right font-semibold">Productos con dato</th>
                  <th className="px-4 py-2 text-left font-semibold">Avance</th>
                  <th className="px-4 py-2 text-left font-semibold">De dónde viene</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(cobertura.data.atributos).map(([code, c]) => (
                  <tr key={code} className="border-b border-border-soft/60 last:border-0">
                    <td className="px-4 py-2 font-medium text-fg">{nombre(code)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted">
                      {num(c.con_valor)} de {num(cobertura.data!.productos)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-28 overflow-hidden rounded-pill bg-surface-3">
                          <div
                            className="h-full rounded-pill bg-primary"
                            style={{ width: `${Math.min(100, c.pct)}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-muted">{pct(c.pct)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(c.por_fuente).map(([src, n]) => (
                          <Badge key={src} tone={FUENTES[src]?.tone ?? "neutral"}>
                            {FUENTES[src]?.label ?? src}: {num(n)}
                          </Badge>
                        ))}
                        {c.con_valor === 0 && <span className="text-faint">Sin datos</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Carga con Excel ─────────────────────────────────────────── */}
      <Card>
        <CardHeader
          eyebrow="Driver de compras"
          title="Cargar atributos y proveedores con Excel"
          subtitle="No toca BSale. Lo que venga en el Excel reemplaza lo adivinado, pero nunca lo que alguien cargó a mano."
        />
        <CardBody className="space-y-5">
          <Paso n={1} titulo="Bajar la plantilla">
            <p className="text-caption text-muted">
              Es el driver de compras de siempre con columnas nuevas (marca, licencia, público,
              temporada…) y listas para elegir. La fila 2 es de ayuda: los productos van{" "}
              <strong>desde la fila 3</strong>. Cada fila necesita el <strong>SKU</strong> o el{" "}
              <strong>código de barras</strong>. Si pones proveedor, costo (C/U) y fecha, también se
              guarda el proveedor de cada producto.
            </p>
            <Button variant="secondary" onClick={descargar}>
              <FileSpreadsheet className="h-4 w-4" /> Bajar plantilla
            </Button>
          </Paso>

          <Paso n={2} titulo="Elegir el Excel lleno y probarlo">
            <p className="text-caption text-muted">
              La prueba revisa el archivo y te dice qué haría. <strong>No guarda nada.</strong>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor={inputId}
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border-soft bg-surface-2 px-4 text-body font-medium text-fg",
                  "transition-colors hover:bg-surface-3",
                )}
              >
                <Upload className="h-4 w-4" /> Elegir Excel
              </label>
              <input
                id={inputId}
                type="file"
                accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                onChange={(e) => {
                  elegirArchivo(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              <span className="text-caption text-muted">
                {archivo ? archivo.name : "Ningún archivo elegido"}
              </span>
              <Button
                onClick={() => archivo && probar.mutate(archivo)}
                disabled={!archivo || cargar.isPending}
                loading={probar.isPending}
              >
                Probar
              </Button>
            </div>
          </Paso>

          {prueba && (
            <Paso n={3} titulo="Revisar y cargar">
              <Resultado r={prueba} nombre={nombre} />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => archivo && cargar.mutate(archivo)}
                  disabled={!archivo || !hayQueCargar}
                  loading={cargar.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" /> Cargar de verdad
                </Button>
                <Button variant="ghost" onClick={() => elegirArchivo(null)} disabled={cargar.isPending}>
                  Cancelar
                </Button>
                {!hayQueCargar && (
                  <span className="text-caption text-warning">
                    No hay nada para guardar: revisa los avisos de arriba.
                  </span>
                )}
              </div>
            </Paso>
          )}

          {cargado && (
            <div className="rounded-xl border border-success/30 bg-success/10 p-4">
              <p className="flex items-center gap-2 text-body font-semibold text-fg">
                <CheckCircle2 className="h-5 w-5 text-success" /> Listo, se cargó “{cargado.archivo}”
              </p>
              <ul className="mt-2 space-y-1 text-caption text-muted">
                <li>
                  <strong>{num(cargado.stats.atributos_escritos)}</strong> dato(s) guardado(s) en{" "}
                  <strong>{num(cargado.stats.emparejadas)}</strong> fila(s).
                </li>
                {cargado.stats.atributos_bloqueados_por_manual > 0 && (
                  <li>
                    <strong>{num(cargado.stats.atributos_bloqueados_por_manual)}</strong> no se
                    cambiaron porque alguien los había cargado a mano.
                  </li>
                )}
                {cargado.stats.relaciones_proveedor > 0 && (
                  <li>
                    <strong>{num(cargado.stats.relaciones_proveedor)}</strong> producto(s) con
                    proveedor ({num(cargado.stats.proveedores_nuevos)} proveedor(es) nuevo(s)).
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-primary/15 text-caption font-semibold text-primary">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <h4 className="text-body font-semibold text-fg">{titulo}</h4>
        {children}
      </div>
    </section>
  );
}

function Resultado({ r, nombre }: { r: ImportDriverResult; nombre: (code: string) => string }) {
  const s = r.stats;
  const porAtributo = Object.entries(r.atributos_por_codigo).filter(([, n]) => n > 0);
  const sinColumnas = r.columnas_de_atributos.length === 0 && !r.columnas_reconocidas.includes("proveedor");

  return (
    <div className="space-y-3 rounded-xl border border-border-soft bg-surface-2/50 p-4">
      <p className="text-caption text-muted">
        Prueba de <strong className="text-fg">{r.archivo}</strong> — todavía no se guardó nada.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cifra label="Filas leídas" valor={s.filas} />
        <Cifra label="Productos encontrados" valor={s.emparejadas} tone="success" />
        <Cifra label="No encontrados" valor={r.sin_match.length} tone={r.sin_match.length ? "warning" : undefined} />
        <Cifra label="Filas con proveedor" valor={s.relaciones_proveedor} />
      </div>

      {sinColumnas && (
        <Aviso tone="warning">
          El archivo no tiene columnas de atributos ni de proveedor. Usa la plantilla del paso 1.
        </Aviso>
      )}

      {porAtributo.length > 0 && (
        <div>
          <p className="mb-1 text-caption font-semibold text-fg">Datos que se van a guardar</p>
          <div className="flex flex-wrap gap-1">
            {porAtributo.map(([code, n]) => (
              <Badge key={code} tone="info">
                {nombre(code)}: {num(n)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {r.proveedores_nuevos.length > 0 && (
        <Aviso tone="info">
          Proveedores nuevos que se van a crear ({r.proveedores_nuevos.length}):{" "}
          {r.proveedores_nuevos.slice(0, 20).join(", ")}
          {r.proveedores_nuevos.length > 20 ? "…" : ""}. Revisa que no estén escritos de otra forma.
        </Aviso>
      )}

      {r.sin_match.length > 0 && (
        <Lista
          titulo={`Filas que no se encontraron en BSale (${r.sin_match.length}) — se saltan`}
          filas={r.sin_match.map((x) => ({
            fila: x.fila,
            texto: [x.sku || x.codigo_barra, x.nombre].filter(Boolean).join(" · "),
            nota: x.motivo,
          }))}
        />
      )}

      {r.advertencias.length > 0 && (
        <Lista
          titulo={`Valores que no se entendieron (${r.advertencias.length}) — se saltan`}
          filas={r.advertencias.map((x) => ({ fila: x.fila, texto: x.detalle }))}
        />
      )}

      {r.tipo_bsale_distinto.length > 0 && (
        <Lista
          titulo={`Tipo BSale distinto al actual (${r.tipo_bsale_distinto.length}) — solo aviso, no se cambia`}
          filas={r.tipo_bsale_distinto.map((x) => ({
            fila: x.fila,
            texto: x.producto,
            nota: `hoy: ${x.tipo_actual} · Excel: ${x.tipo_driver}`,
          }))}
        />
      )}
    </div>
  );
}

function Cifra({ label, valor, tone }: { label: string; valor: number; tone?: "success" | "warning" }) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface/60 px-3 py-2">
      <p className="text-[0.65rem] uppercase tracking-wider text-faint">{label}</p>
      <p
        className={cn(
          "text-h3 font-semibold tabular-nums",
          tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-fg",
        )}
      >
        {num(valor)}
      </p>
    </div>
  );
}

function Aviso({ tone, children }: { tone: "warning" | "info"; children: React.ReactNode }) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-caption",
        tone === "warning" ? "border-warning/30 bg-warning/10 text-fg" : "border-info/30 bg-info/10 text-fg",
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "warning" ? "text-warning" : "text-info")} />
      <span>{children}</span>
    </p>
  );
}

function Lista({
  titulo,
  filas,
}: {
  titulo: string;
  filas: { fila: number; texto: string; nota?: string }[];
}) {
  return (
    <details className="rounded-lg border border-border-soft bg-surface/40">
      <summary className="cursor-pointer px-3 py-2 text-caption font-semibold text-fg">{titulo}</summary>
      <ul className="max-h-64 space-y-1 overflow-y-auto px-3 pb-3 text-caption">
        {filas.slice(0, MAX_FILAS).map((f, i) => (
          <li key={`${f.fila}-${i}`} className="flex gap-2">
            <span className="shrink-0 tabular-nums text-faint">Fila {f.fila}</span>
            <span className="min-w-0 text-fg">{f.texto || "—"}</span>
            {f.nota && <span className="text-muted">— {f.nota}</span>}
          </li>
        ))}
        {filas.length > MAX_FILAS && (
          <li className="text-faint">y {num(filas.length - MAX_FILAS)} más…</li>
        )}
      </ul>
    </details>
  );
}
