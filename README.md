# KAWII BI — Frontend

Dashboard multi-tenant para el módulo de business intelligence de KAWII. Consume la API en [`backend_hudec`](../backend_hudec) y sirve 4 vistas principales + admin de configuración.

> **Nota Next.js**: la versión (16.x) trae breaking changes vs docs viejos. Antes de escribir código, consultar `node_modules/next/dist/docs/`. Heed deprecation notices — el AGENTS.md manda.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, RSC) |
| UI | React 19 · Tailwind CSS · lucide-react |
| Data | @tanstack/react-query · fetch nativo |
| Charts | recharts (donut, bar, time-series) |
| Auth | Cookie httpOnly (backend) + `X-Company-Id` (multi-tenant) |
| Types | TypeScript strict, sin `any` |

---

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar env
cp .env.local.example .env.local
# Editar NEXT_PUBLIC_API_BASE_URL si el backend no está en localhost:8000

# 3. Levantar el backend (en otra terminal, dentro de backend_hudec/)
uvicorn app.main:app --reload --port 8000

# 4. Levantar el frontend
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Usuario admin por defecto: `admin` / `admin15-L` (bootstrap del backend cuando `app_users` está vacía).

---

## Scripts

```bash
npm run dev          # Turbopack dev server en :3000
npm run build        # Build de producción (SSG donde se puede)
npm run start        # Servir el build de producción
npm run lint         # ESLint
npx tsc --noEmit     # Type-check sin emitir JS
```

**CI checklist antes de merge**: `tsc --noEmit` limpio + `next build` verde + verificación visual en el browser.

---

## Arquitectura

### Estructura de carpetas

```
src/
├── app/                    Rutas Next (App Router)
│   ├── pulso/              (thin wrappers que importan una <FeatureView />)
│   ├── diagnostico/
│   ├── salud-catalogo/
│   ├── plan-mes/
│   ├── configuracion/      (tabs con ?tab= como fuente de verdad)
│   └── ...
├── components/             UI kit + shell + contextos globales
│   ├── ui/                 Card, Button, Badge, KpiStat, MetricGauge, states…
│   ├── charts/             Wrappers de recharts
│   ├── nav.ts              Definición del sidebar (NAV_GROUPS)
│   ├── app-shell.tsx       Layout + sidebar + selectores globales
│   ├── auth-context.tsx    Session del user
│   ├── company-context.tsx X-Company-Id activo
│   └── sucursal-context.tsx office_id activo (persiste localStorage)
├── features/               Módulos de negocio (uno por vista)
│   ├── bi/shared/          Primitives compartidos entre las 4 vistas BI
│   ├── pulso/
│   │   ├── components/
│   │   └── hooks/
│   ├── diagnostico/
│   ├── salud-catalogo/
│   ├── plan-mes/
│   ├── config-targets/     Admin category_targets (tab de /configuracion)
│   └── config-costos/      Admin variant_costs (tab de /configuracion)
└── lib/
    ├── api.ts              Cliente HTTP legacy + request() exportado
    ├── bi-api.ts           Cliente HTTP del módulo BI (usa request())
    ├── bi-types.ts         Tipos del backend BI (Pulse, Diagnosis, …)
    ├── types.ts            Tipos legacy
    ├── format.ts           money(), num(), pct(), dateShort()…
    ├── utils.ts            cn() (Tailwind class merger)
    └── toast.ts            sonner-like helper
```

**Regla**: una `features/<nombre>/` = una vista o admin panel. Sus `components/` y `hooks/` sólo pueden ser importados por su propia página en `app/`. Compartir entre features va en `features/bi/shared/` o `components/ui/`.

### Multi-tenant

El helper [`request<T>()`](src/lib/api.ts) inyecta automáticamente:
- `Authorization` implícito vía cookie httpOnly (`credentials: 'include'`).
- Header `X-Company-Id` desde `localStorage.getItem("kawii.company")`.

Ningún fetcher recibe `company_id` como parámetro. Al cambiar de empresa (`CompanyProvider`), invalidar `["bi"]` y `["goals"]` en react-query — el resto se refetcha solo.

### Filtro por sucursal

`useSucursal()` expone `officeId | null` y persiste en localStorage. Cada vista lo pasa como `office_id` a su fetcher. `null` = todas las sucursales del scope de la empresa.

### Cache de react-query

Wrapper opinionado [`useBIQuery`](src/features/bi/shared/useBIQuery.ts):
- `staleTime: 5min` (los datos no cambian hasta el sync nocturno).
- `retry: 2` con backoff exponencial (endpoints pesados como `/plan` pueden colgarse).
- `refetchOnWindowFocus: false`.

Query keys centralizadas en [`biQueryKeys`](src/lib/bi-api.ts) — invalidar `["bi"]` limpia todo el módulo.

---

## Convenciones

### UI

- **Colores por tono**: `neutral | primary | success | warning | danger | info | violet`. Uso via Tailwind: `bg-{tone}/12 text-{tone} border-{tone}/25` o via CSS vars: `var(--color-{tone})`.
- **Cards**: usar `<Card>` + `<CardHeader>` + `<CardBody>` de `components/ui/card.tsx`. Nunca hand-roll superficies.
- **Badges**: `<Badge tone={t}>`. Mapas código→tono viven en `features/bi/shared/constants.ts`.
- **Estados semafóricos**: `EstadoBadge`, `VeredictoBadge`, `SeveridadBadge` — ya vienen coloreados por `MetaEstado` / `VeredictoCodigo` / `AlertaSeveridad`.
- **Iconos**: solo `lucide-react`. Tamaños comunes: `h-3 w-3` (badge), `h-4 w-4` (button), `h-5 w-5` (header).

### Formateo

Todo por `src/lib/format.ts` (Perú, PEN):
```ts
money(1234.5)       // "S/ 1,234.50"
moneyCompact(50000) // "S/ 50 K"
num(1234)           // "1,234"
pct(84.3)           // "84.3%"
dateShort("2026-07-03") // "3 jul 2026"
```

Deltas específicos del módulo BI en `features/bi/shared/format-bi.ts`:
```ts
formatDeltaPct(-4.1)   // "−4.1%"
formatDeltaMoney(1234) // "+S/ 1,234.00"
deltaTone(-6.2)        // "danger"
formatMes("2026-07")   // "Julio 2026"
```

### Patrón "Opción B" (Total vs Recurrente)

El backend BI devuelve casi todos los montos en 2 versiones: `total` (con estacionales) y `recurrente` (base operativa). Renderizar el total como número principal y el recurrente como sub-número:

```tsx
<TotalRecurrentePair
  total={mes.venta_acumulada}
  recurrente={mes.venta_acumulada_recurrente}
  size="xl"
/>
```

### Banners cross-cutting

Cada vista BI debe montar arriba de todo:
```tsx
<CoberturaBanner
  cobertura={data.meta.cobertura_costos}
  onAudit={() => router.push("/configuracion?tab=costos")}
/>
<EstacionalesInfo exclusiones={data.meta.exclusiones} />
```

`CoberturaBanner` se auto-oculta si el estado es `OK`. `EstacionalesInfo` si no hay exclusiones.

---

## Cómo agregar una vista BI nueva

Ver [`docs/adding-a-bi-view.md`](docs/adding-a-bi-view.md) — receta paso a paso basada en las 10 fases con las que se armó el módulo BI original.

---

## Deploy

El proyecto está pensado para deploy en **Vercel** o cualquier proveedor que soporte Next.js 16 SSR/SSG.

Variables de entorno requeridas:

| Variable | Ejemplo | Notas |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.kawii.com.pe` | Sin trailing slash. |

CORS del backend debe permitir el origen del frontend con `allow_credentials=True` (ya está configurado en `backend_hudec/app/main.py`).

---

## Troubleshooting

- **"No se pudo conectar con la API"** al hacer login → el backend no está corriendo o el `NEXT_PUBLIC_API_BASE_URL` es incorrecto.
- **Login OK pero `/pulse` responde 400 "Falta el header X-Company-Id"** → el user tiene 0 empresas o no seleccionó una en `/select-company`.
- **`/plan-mes` crashea el browser en dev** → el fetch de `/plan` puede ser >45s. En prod anda. Si querés reproducir en dev, esperá pacientemente y evitá reloads.
- **Fast Refresh triggers full reload** → error runtime dentro de un componente. Revisar console del browser, no del server.

---

## Contribuir

- No romper la línea de `tsc --noEmit` limpio.
- Warnings de ESLint en código nuevo = arreglar. En código legacy = documentar con `// TODO` y no bloquear el merge.
- Antes de PR: `next build` verde localmente.
- Los CI-relevant `.md`, `nav.ts`, `bi-types.ts`, `bi-api.ts` requieren review de un maintainer.
