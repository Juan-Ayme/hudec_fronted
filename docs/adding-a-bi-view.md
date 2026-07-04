# Cómo agregar una vista BI nueva

Receta paso a paso para agregar una vista al dashboard KAWII BI. Es la misma que se usó para armar las 4 vistas actuales (`/pulso`, `/diagnostico`, `/salud-catalogo`, `/plan-mes`) + admin.

**Público**: dev que ya leyó el [README](../README.md) y tiene el proyecto corriendo local.

**Tiempo estimado por vista**: 4-8 horas si el backend ya expone el endpoint.

---

## Antes de empezar

Confirmar 3 cosas:

1. **El endpoint del backend existe y responde 200** para el user admin. Verificar con `curl` o desde el DevTools de una vista existente.
2. **Tenés el shape documentado** (JSON de ejemplo o schema). El módulo BI escribe los tipos manualmente porque el backend no expone OpenAPI útil.
3. **Sabés qué comparte con las vistas existentes**: si necesita banner de cobertura, patrón total/recurrente, exclusiones estacionales, veredicto — todos esos primitives ya existen en `features/bi/shared/`.

---

## Fase 1 — Tipos + cliente HTTP

Todos los tipos del backend BI viven en un solo archivo: [`src/lib/bi-types.ts`](../src/lib/bi-types.ts). No los rompas en múltiples archivos.

### 1.1 Escribir los tipos

Agregá al final de `bi-types.ts`:

```ts
// ─────────────────────── Vista N — Nombre ───────────────────────

export interface MiVistaMeta extends MetaBase {
  fecha: string;
  // otros campos del meta específicos de este endpoint
}

export interface MiVistaResponse {
  meta: MiVistaMeta;
  // sub-objetos de la respuesta...
  resumen: string[];
}
```

**Reglas**:
- Extender `MetaBase` para el `.meta` — asegura `office_id`, `office_scope`, `exclusiones`, `cobertura_costos` automáticamente.
- Reusar `MetaEstado`, `VeredictoCodigo`, `AlertaSeveridad`, `TargetRol`, etc. que ya están declarados.
- Los deltas nullable: `delta_pct: number | null` (el backend a veces devuelve null).
- Arrays de sub-objetos SIEMPRE con su propia interfaz — nunca `Array<{...}>` inline.
- **Sub-objetos que el backend puede devolver `null`**: marcarlos `foo: Foo | null` explícitamente. Ver [Fase 8 — bug real que costó horas de debug](#fase-8--verificación-final).

### 1.2 Validar el shape contra el backend real

Antes de escribir un solo componente, verificá que tus tipos coinciden con la respuesta:

```js
// Ejecutar en la consola del browser, logueado:
const r = await fetch('http://localhost:8000/mi-endpoint', {
  credentials: 'include',
  headers: { 'X-Company-Id': '1' }
});
const j = await r.json();
console.log(Object.keys(j));                // ¿matchean tu MiVistaResponse?
console.log(Object.keys(j.meta));           // ¿matchea MiVistaMeta?
console.log(j.rows?.[0] && Object.keys(j.rows[0])); // ¿matchea RowInterface?
```

Si aparecen campos extra que no documentaste, agregarlos ahora al tipo. Si tenés `Uncaught TypeError` en runtime más adelante, es acá donde faltó cubrir un caso.

### 1.3 Fetcher en bi-api.ts

Agregar a [`src/lib/bi-api.ts`](../src/lib/bi-api.ts):

```ts
export interface MiVistaParams {
  office_id?: number | null;
  // params del query string
}

export const getMiVista = (
  params: MiVistaParams = {},
  signal?: AbortSignal,
) =>
  request<MiVistaResponse>("/mi-endpoint", {
    query: {
      office_id: params.office_id ?? undefined,
      // otros params
    },
    signal,
  });
```

Y agregar la query key:

```ts
export const biQueryKeys = {
  // ... existentes
  miVista: (office_id: number | null, foo: string | undefined) =>
    ["bi", "mi-vista", office_id, foo] as const,
} as const;
```

**Reglas**:
- Reusar `request()` de `api.ts` (importado). Nunca hacer `fetch()` directo — perdés `X-Company-Id`.
- Query keys empiezan con `["bi", ...]` — invalidar `["bi"]` limpia todo el módulo (útil al cambiar de empresa).
- Params opcionales pasan `?? undefined` al `query` — el `buildQuery` interno los omite.

**Type-check**: `npx tsc --noEmit` debe estar limpio antes de seguir.

---

## Fase 2 — Hook de datos

Un solo archivo por vista: `src/features/mi-vista/hooks/useMiVista.ts`.

```ts
"use client";

import { useState } from "react";
import { getMiVista, biQueryKeys } from "@/lib/bi-api";
import { useSucursal } from "@/components/sucursal-context";
import { useBIQuery } from "@/features/bi/shared";
import type { MiVistaResponse } from "@/lib/bi-types";

export function useMiVista() {
  const { officeId } = useSucursal();
  const [foo, setFoo] = useState<Foo>("default");

  const q = useBIQuery<MiVistaResponse>({
    queryKey: biQueryKeys.miVista(officeId, foo),
    queryFn: ({ signal }) => getMiVista({ office_id: officeId, foo }, signal),
  });

  return { q, officeId, foo, setFoo };
}
```

**Reglas**:
- Estados locales de UI (filtros, tabs) viven en el hook — no en el componente.
- `useBIQuery` en lugar de `useQuery` para heredar los defaults del módulo.
- Si la vista tiene mutations (guardar meta, ejecutar backfill), sumarlas al mismo hook y devolverlas en el objeto de retorno.

---

## Fase 3 — Componentes

Un componente por concepto. Un archivo por componente. Todos "use client" (aunque no siempre lo necesiten — es la convención del proyecto).

### 3.1 Estructura

```
features/mi-vista/components/
├── MiVistaView.tsx         Orquesta todas las secciones, maneja loading/error
├── HeaderMiVista.tsx       KPI grande arriba
├── SeccionA.tsx
├── SeccionB.tsx
└── ...
```

### 3.2 View principal (patrón estándar)

```tsx
"use client";

import { useRouter } from "next/navigation";
import { MiIcono } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/states";
import {
  CoberturaBanner,
  EstacionalesInfo,
} from "@/features/bi/shared";
import { useMiVista } from "../hooks/useMiVista";
import { HeaderMiVista } from "./HeaderMiVista";
import { SeccionA } from "./SeccionA";

export function MiVistaView() {
  const router = useRouter();
  const { q } = useMiVista();

  if (q.isError) return <ErrorState error={q.error} />;
  if (q.isLoading || !q.data) return <LoadingState label="Cargando…" />;

  const d = q.data;

  return (
    <div className="flex flex-col gap-5">
      <CoberturaBanner
        cobertura={d.meta.cobertura_costos}
        onAudit={() => router.push("/configuracion?tab=costos")}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MiIcono className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-h2 font-bold text-fg">Mi Vista</h1>
          <span className="text-caption text-faint">· {d.meta.fecha}</span>
        </div>
        <EstacionalesInfo exclusiones={d.meta.exclusiones} />
      </div>

      <HeaderMiVista data={d.header} />
      <SeccionA data={d.seccionA} />
      {/* … */}
    </div>
  );
}
```

**Reglas**:
- Loading/error PRIMERO — nunca renderizar componentes con `data` potencialmente `undefined`.
- `CoberturaBanner` y `EstacionalesInfo` van arriba de todo — son cross-cutting.
- El title clickeable a `/plan-mes` u otras vistas usa `<Link>` de `next/link` — no `router.push` en un `<a>`.
- **Nunca uses `router.push` en un botón que puede recibir click accidental**. Los botones que naveguen usan `<Link>` para prefetch + a11y.

### 3.3 Sub-componentes (patrón estándar)

```tsx
"use client";

import { MiIcono } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { money, pct } from "@/lib/format";
import type { MiSubData } from "@/lib/bi-types";
import { EstadoBadge, TotalRecurrentePair } from "@/features/bi/shared";

export function SeccionA({ data }: { data: MiSubData }) {
  return (
    <Card>
      <CardHeader
        eyebrow="Descripción corta arriba"
        title={
          <span className="flex items-center gap-2">
            <MiIcono className="h-5 w-5 text-info" />
            Título principal
          </span>
        }
        subtitle="Contexto opcional"
      />
      <CardBody className="…">
        {/* contenido */}
      </CardBody>
    </Card>
  );
}
```

**Reglas para tablas**:
- Sticky header con `sticky top-0 bg-surface-2/95 backdrop-blur-md`.
- Wrapper con `max-h-96 overflow-y-auto custom-scrollbar` para scroll interno.
- `font-mono tabular-nums` para números — alinea decimales sin CSS grid.
- Colorear delta por signo con `deltaTone()`.

**Reglas para arrays potencialmente `null`**:
```tsx
// MAL — crashea si el backend manda null:
const has = data.items.length > 0;
{data.items.map(...)}

// BIEN:
const has = (data.items?.length ?? 0) > 0;
{data.items?.map(...)}
```

---

## Fase 4 — Página

Thin wrapper en `src/app/mi-vista/page.tsx`:

```tsx
"use client";

import { MiVistaView } from "@/features/mi-vista/components/MiVistaView";

export default function MiVistaPage() {
  return <MiVistaView />;
}
```

**Nunca** metas lógica de datos en el `page.tsx`. Es sólo un import + return.

---

## Fase 5 — Nav

Agregar al array `NAV_GROUPS` en [`src/components/nav.ts`](../src/components/nav.ts):

```ts
{
  title: "BI",
  items: [
    { href: "/pulso", label: "Pulso", icon: Activity },
    { href: "/diagnostico", label: "Diagnóstico", icon: Gauge },
    { href: "/salud-catalogo", label: "Salud del Catálogo", icon: ShieldCheck },
    { href: "/plan-mes", label: "Plan del Mes", icon: CalendarClock },
    { href: "/mi-vista", label: "Mi Vista", icon: MiIcono },  // ← nueva
  ],
},
```

Si el ícono no está importado arriba del archivo, agregarlo al `import ... from "lucide-react"`.

**Grupos existentes**: Análisis · Reportes · Catálogo · **BI** · Beta / Legacy · Operaciones. Poné la vista en el grupo correcto.

---

## Fase 6 — Admin panel (si aplica)

Si tu endpoint tiene contraparte de admin (bootstrap, edit, delete), va como TAB dentro de `/configuracion`, no como página separada.

### 6.1 Feature folder

```
features/config-mi-cosa/
├── hooks/
│   └── useMiCosaAdmin.ts    Query lista + mutations
└── components/
    └── MiCosaPanel.tsx      Todo el UI del tab
```

### 6.2 Registrar el tab

En [`src/app/configuracion/page.tsx`](../src/app/configuracion/page.tsx):

```tsx
type Tab = "departments" | ... | "mi-cosa" | "backups";

const VALID_TABS: readonly Tab[] = [
  "departments", ..., "mi-cosa", "backups",
];

// En el render:
{tab === "mi-cosa" && <MiCosaPanel />}

// En el array de items del <Tabs>:
{ id: "mi-cosa", label: "Mi Cosa", icon: MiIcono },
```

Los tabs usan `?tab=` como fuente de verdad — **no** tener state local paralelo. El patrón está resuelto y funciona con deep-linking desde otros lados (ej. el `CoberturaBanner` linkea a `?tab=costos`).

---

## Fase 7 — Onboarding (si es una vista crítica)

Si la nueva vista requiere setup previo del user (cargar targets, correr backfill), agregar un paso al checklist [`src/features/bi/shared/OnboardingChecklist.tsx`](../src/features/bi/shared/OnboardingChecklist.tsx):

```tsx
const steps = [
  // … existentes
  {
    id: "mi-paso",
    label: "Descripción corta",
    done: /* condición basada en un query */,
    href: "/donde-completarlo",
    hint: !done ? "Qué hacer para completarlo." : undefined,
  },
];
```

**Regla**: el checklist consulta endpoints livianos. Si necesitás data pesada, cachearla con la misma query key que la vista destino — así comparten cache.

---

## Fase 8 — Verificación final

Orden estricto — no saltear pasos:

```bash
# 1. Type-check
npx tsc --noEmit

# 2. Lint (0 errors, warnings sólo si son de código legacy pre-existente)
npx eslint src/features/mi-vista/ src/app/mi-vista/

# 3. Build de producción — el más importante
npx next build
```

Si los 3 pasan, arrancá el dev server y navegá a la vista:

```bash
npm run dev
```

En el browser:

1. **Ver la consola** — cualquier `Uncaught TypeError` es bloqueante.
2. **Ver la network tab** — verificar que `X-Company-Id` va en el header.
3. **Cambiar de sucursal** — la vista debe refetchar y no romper.
4. **Cambiar de empresa** — todo `["bi"]` debe invalidar.

### Bugs reales que costaron horas de debug

**"Cannot read properties of null (reading 'length')"** en `PresupuestoCard` — el backend a veces devuelve `desglose_por_categoria: null` cuando no hay category_targets cargados. Fix: `?.length ?? 0` en toda comprobación de arrays potencialmente null. **Buscar todos los `.length` y `.map` de sub-objetos y hardenearlos**.

**"Falta el header X-Company-Id" en 400** al cargar la vista — el usuario nuevo tiene 0 empresas asignadas o no seleccionó una. Interceptar en `<CompanyProvider>` y redirigir a `/select-company`.

**Vista funciona con office_id=null pero rompe con office_id específico** — el backend tiene un bug de scope. Reportar al backend, no workaroundear en el frontend.

**El fetch tarda 60+ segundos y el browser se cuelga** — endpoint pesado. Aumentar `staleTime`, mostrar loading state amable, considerar paginación en el backend.

---

## Checklist final antes de PR

- [ ] `npx tsc --noEmit` limpio
- [ ] `npx eslint src/features/mi-vista/ src/app/mi-vista/` sin errores nuevos
- [ ] `npx next build` verde
- [ ] Vista renderiza con `office_id` `null`, `1`, y otros office_ids
- [ ] Cambio de empresa dispara refetch
- [ ] Loading y error states amables
- [ ] `CoberturaBanner` + `EstacionalesInfo` montados si aplica
- [ ] Nav actualizado con nueva ruta
- [ ] Colores por tono (no hex hardcoded)
- [ ] Todos los `.length` / `.map` de sub-objetos son null-safe
- [ ] No hay imports huérfanos
- [ ] `page.tsx` es thin wrapper
- [ ] Tabla de admin (si aplica) registrada en `/configuracion?tab=…`

---

## Referencia rápida — primitives compartidos

Todos importables desde `@/features/bi/shared`:

| Componente | Uso |
|---|---|
| `CoberturaBanner` | Banner condicional de cobertura de costos |
| `EstacionalesInfo` | Popover con dep/cat excluidos |
| `TotalRecurrentePair` | Patrón "Opción B" (total + recurrente) |
| `EstadoBadge` | Badge por `MetaEstado` |
| `VeredictoBadge` | Badge por `VeredictoCodigo` |
| `SeveridadBadge` | Badge por `AlertaSeveridad` |
| `VeredictoCard` | Card grande con veredicto + explicación + deltas |
| `AlertaChip` / `AlertaList` | Chips priorizados con acción sugerida |
| `OnboardingChecklist` | Checklist de setup en `/pulso` |
| `useBIQuery` | Wrapper de `useQuery` con defaults del módulo |

Helpers:

| Función | Uso |
|---|---|
| `formatDeltaPct(v)` | `"+12.3%"` / `"−4.1%"` / `"—"` |
| `formatDeltaMoney(v)` | `"+S/ 1,234.50"` / `"−S/ 800.00"` |
| `formatDeltaPp(v)` | `"+3.2 pp"` (variación de porcentaje) |
| `deltaTone(v)` | `BadgeTone` según signo/magnitud |
| `formatMes("2026-07")` | `"Julio 2026"` |
| `formatAvance(84.3)` | `{ text: "84.3%", tone: "warning" }` |

Constants:

| Mapa | Cubre |
|---|---|
| `ESTADO_META` | `MetaEstado` → `{ tone, label, icon }` |
| `VEREDICTO` | `VeredictoCodigo` → id. |
| `SEVERIDAD_ALERTA` | `AlertaSeveridad` → id. |
| `COBERTURA` | `CoberturaEstado` → id. |
| `ROL_TARGET` | `TargetRol` → id. |
| `TENDENCIA` | `TendenciaCategoria` → id. |
| `SKUS_ESTADO` | `SkusEstado` → id. |
| `COMPOSICION_BUCKET` | `ComposicionBucket` → id. |

---

## Historial

Este documento y el módulo BI original fueron implementados en 10 fases secuenciales:

1. Tipos + cliente HTTP (`bi-types.ts`, `bi-api.ts`)
2. Shared UI primitives (`features/bi/shared/`)
3. Vista `/pulso`
4. Vista `/diagnostico`
5. Vista `/salud-catalogo`
6. Vista `/plan-mes`
7. Admin category targets (`/configuracion?tab=targets`)
8. Admin variant costs (`/configuracion?tab=costos`)
9. Onboarding checklist
10. Cleanup nav (Beta / Legacy)

Cada fase es una PR chica e independiente. Seguí este orden si armás un nuevo módulo grande — la fase 1 desbloquea todo lo demás.
