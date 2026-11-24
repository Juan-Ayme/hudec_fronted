"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useCompany } from "@/components/company-context";
import { useBIQuery } from "@/features/bi/shared";
import { toast } from "@/lib/toast";
import {
  getReglasInformes,
  guardarReglasInformes,
  reglasInformesKey,
  type ReglasInformes,
  type ValorRegla,
} from "@/lib/informes-api";

/**
 * Reglas de los informes por empresa (`/config/informes-reglas`): presupuesto de la compra
 * semanal, qué departamentos no entran, qué es básico o de consumo, hora de fin de la mañana…
 * Antes solo se podían cambiar por la API, y el panel de compras usaba un presupuesto fijo.
 *
 * Cada regla se edita según el tipo de su valor por defecto:
 *   número → campo numérico · texto → campo de texto · lista → una por línea ·
 *   diccionario → una por línea con "clave: valor" (o "clave: a, b" si el valor es una lista).
 */

const GRUPOS: { titulo: string; prefijos: string[] }[] = [
  { titulo: "¿Qué compramos esta semana?", prefijos: ["compras_"] },
  { titulo: "Campaña de juguetes", prefijos: ["juguetes_"] },
  { titulo: "Tiendas y mañanas", prefijos: ["manana_", "campanas_"] },
  { titulo: "Informe por periodo", prefijos: ["periodo_"] },
];

const ETIQUETAS: Record<string, string> = {
  compras_presupuesto_min: "Presupuesto mínimo (S/)",
  compras_presupuesto_max: "Presupuesto máximo (S/)",
  compras_departamentos_excluidos: "Departamentos que no entran",
  compras_palabras_excluidas: "Palabras que sacan un producto",
  compras_solo_categorias: "Departamentos con solo algunas categorías",
  compras_basicos: "Básicos (siempre debe haber)",
  compras_consumo_departamentos: "Departamentos de consumo",
  compras_consumo_excluir: "No son consumo (palabras)",
  juguetes_departamento: "Departamento de juguetes",
  juguetes_markup_min_pct: "Markup mínimo para recomprar (%)",
  manana_fin_hora: "La mañana termina a las (hora)",
  campanas_por_departamento: "Departamento → campaña",
  periodo_tendencia_pct: "Sube o baja desde (± %)",
  periodo_acelera_sku_pct: "Comprar más si sube (%)",
  periodo_min_unidades: "Unidades mínimas para comprar más",
  periodo_cobertura_max_dias: "Comprar más si quedan menos de (días)",
};

type Tipo = "numero" | "texto" | "lista" | "dic_lista" | "dic_texto";

function tipoDe(def: ValorRegla): Tipo {
  if (typeof def === "number") return "numero";
  if (typeof def === "string") return "texto";
  if (Array.isArray(def)) return "lista";
  const hoja = Object.values(def)[0];
  return Array.isArray(hoja) ? "dic_lista" : "dic_texto";
}

/** Valor guardado → texto del campo. */
function aTexto(v: ValorRegla, tipo: Tipo): string {
  if (tipo === "numero" || tipo === "texto") return String(v ?? "");
  if (tipo === "lista") return (v as string[]).join("\n");
  return Object.entries(v as Record<string, string | string[]>)
    .map(([k, x]) => `${k}: ${Array.isArray(x) ? x.join(", ") : x}`)
    .join("\n");
}

/** Texto del campo → valor para el backend. `null` si no es válido. */
function aValor(t: string, tipo: Tipo): ValorRegla | null {
  const lineas = t.split("\n").map((l) => l.trim()).filter(Boolean);
  if (tipo === "numero") {
    const n = Number(t.replace(",", "."));
    return t.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
  }
  if (tipo === "texto") return t.trim() ? t.trim() : null;
  if (tipo === "lista") return lineas;
  const out: Record<string, string | string[]> = {};
  for (const l of lineas) {
    const i = l.indexOf(":");
    if (i <= 0) return null;
    const k = l.slice(0, i).trim();
    const resto = l.slice(i + 1).trim();
    if (!k || !resto) return null;
    out[k] = tipo === "dic_lista" ? resto.split(",").map((x) => x.trim()).filter(Boolean) : resto;
  }
  return out;
}

const igual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function ReglasInformesPanel() {
  const qc = useQueryClient();
  const { activeRole } = useCompany();
  const esAdmin = activeRole === "admin";
  const q = useBIQuery<ReglasInformes>({
    queryKey: reglasInformesKey,
    queryFn: ({ signal }) => getReglasInformes(signal),
  });
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [base, setBase] = useState<string | null>(null);

  // Al llegar (o cambiar) las reglas guardadas, los campos vuelven a ellas.
  const firma = q.data ? JSON.stringify(q.data.reglas) : null;
  if (q.data && firma !== base) {
    setBase(firma);
    setTextos(Object.fromEntries(Object.entries(q.data.reglas).map(([k, v]) => [k, aTexto(v, tipoDe(q.data!.defaults[k] ?? v))])));
  }

  const cambios = useMemo(() => {
    if (!q.data) return { validos: {} as Record<string, ValorRegla>, malos: [] as string[] };
    const validos: Record<string, ValorRegla> = {};
    const malos: string[] = [];
    for (const [k, t] of Object.entries(textos)) {
      const v = aValor(t, tipoDe(q.data.defaults[k]));
      if (v === null) malos.push(k);
      else if (!igual(v, q.data.reglas[k])) validos[k] = v;
    }
    return { validos, malos };
  }, [textos, q.data]);

  const guardar = useMutation({
    mutationFn: () => guardarReglasInformes(cambios.validos),
    onSuccess: () => {
      toast.success("Reglas guardadas", { description: "Los próximos informes ya las usan." });
      qc.invalidateQueries({ queryKey: reglasInformesKey });
    },
    onError: (e) => toast.error("No se pudo guardar", { description: e instanceof Error ? e.message : undefined }),
  });

  if (q.isError) return <ErrorState error={q.error} />;
  if (q.isLoading || !q.data) return <LoadingState label="Cargando las reglas de los informes…" />;
  const d = q.data;
  const nCambios = Object.keys(cambios.validos).length;
  const claves = Object.keys(d.defaults);
  const sinGrupo = claves.filter((k) => !GRUPOS.some((g) => g.prefijos.some((p) => k.startsWith(p))));
  const grupos = [...GRUPOS.map((g) => ({ titulo: g.titulo, claves: claves.filter((k) => g.prefijos.some((p) => k.startsWith(p))) })),
                  ...(sinGrupo.length ? [{ titulo: "Otras", claves: sinGrupo }] : [])];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          eyebrow="Informes"
          title="Reglas de los informes de esta empresa"
          subtitle={esAdmin
            ? "Lo que cambies aquí lo usan los informes desde el próximo que generes. Los campos de lista van uno por línea."
            : "Solo un administrador puede cambiarlas."}
          action={esAdmin && (
            <Button onClick={() => guardar.mutate()} loading={guardar.isPending}
                    disabled={nCambios === 0 || cambios.malos.length > 0}>
              <Save className="h-4 w-4" /> {nCambios ? `Guardar ${nCambios} cambio${nCambios > 1 ? "s" : ""}` : "Guardar"}
            </Button>
          )}
        />
        {cambios.malos.length > 0 && (
          <CardBody>
            <p className="text-caption text-danger">
              {`Revisa: ${cambios.malos.map((k) => ETIQUETAS[k] ?? k).join(", ")} (vacío, número inválido o una línea sin "clave: valor").`}
            </p>
          </CardBody>
        )}
      </Card>

      {grupos.map((g) => (
        <Card key={g.titulo}>
          <CardHeader title={g.titulo} />
          <CardBody className="grid gap-4 md:grid-cols-2">
            {g.claves.map((k) => {
              const tipo = tipoDe(d.defaults[k]);
              const texto = textos[k] ?? "";
              const malo = cambios.malos.includes(k);
              const porDefecto = aTexto(d.defaults[k], tipo);
              const esDefecto = texto.trim() === porDefecto.trim();
              const hint = (
                <>
                  {d.descripciones[k]}
                  {esAdmin && !esDefecto && (
                    <button type="button" className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
                            onClick={() => setTextos((t) => ({ ...t, [k]: porDefecto }))}>
                      <RotateCcw className="h-3 w-3" /> por defecto
                    </button>
                  )}
                </>
              );
              const comun = {
                value: texto,
                disabled: !esAdmin,
                "aria-invalid": malo || undefined,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setTextos((t) => ({ ...t, [k]: e.target.value })),
              };
              return (
                <Field key={k} label={ETIQUETAS[k] ?? k} hint={hint}
                       className={tipo === "numero" || tipo === "texto" ? "" : "md:col-span-2"}>
                  {tipo === "numero" || tipo === "texto" ? (
                    <Input type={tipo === "numero" ? "number" : "text"} min={0} {...comun} />
                  ) : (
                    <textarea rows={Math.min(8, Math.max(3, texto.split("\n").length + 1))} spellCheck={false}
                              className="w-full rounded-xl border border-border/40 bg-surface-2/40 px-3.5 py-2.5 font-mono text-caption text-fg focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 aria-[invalid=true]:border-danger/70"
                              {...comun} />
                  )}
                </Field>
              );
            })}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
