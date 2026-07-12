# Web — Botica Conquistadores Farma

Frontend del sistema de gestión de inventarios y ventas, construido con **Next.js**
(App Router) y **Tailwind CSS**. Consume la API REST del backend. Forma parte del
proyecto general — ver el [README raíz](../../README.md) para el contexto y el alcance.

## Requisitos

- Node.js LTS
- pnpm

## Puesta en marcha

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000`.

Para que la app funcione de extremo a extremo necesitas la [API](../api) corriendo
(por defecto en `http://localhost:4000`).

## Variables de entorno

No necesitas ninguna en desarrollo: el navegador llama a `/api/*` y Next
reenvía a la API (rewrite en `next.config.ts`, por defecto `http://localhost:4000`).

| Variable | Descripción | Ejemplo |
|---|---|---|
| `API_PROXY_URL` | Destino interno del rewrite `/api/*` (se fija en build) | `http://api:4000` |

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | ESLint |

## Estructura

```
src/
└── app/          Rutas y layouts (App Router)
```

- **TypeScript** en todo el proyecto.
- **Tailwind CSS** para estilos.
- Alias de importación `@/*` → `src/*`.

> Estado actual: proyecto recién inicializado (scaffold de Next.js). Las pantallas
> (login, ventas, inventario, lotes, reportes, panel de control) se irán construyendo
> según el [roadmap](../../docs/logbook/roadmap.md).

## Nota sobre la versión de Next.js

Este proyecto usa una versión de Next.js con cambios de API respecto a versiones
previas. Antes de escribir código, revisa las guías en `node_modules/next/dist/docs/`
y atiende los avisos de deprecación.
