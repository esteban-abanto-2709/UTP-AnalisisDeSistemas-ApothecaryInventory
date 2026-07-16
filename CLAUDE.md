# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Sistema de gestión de inventarios y ventas para una botica (Botica Conquistadores
Farma S.A.C.), proyecto académico UTP. El fondo conceptual está en
[`docs/concepto.md`](docs/concepto.md); el seguimiento operativo en
[`docs/logbook/`](docs/logbook/).

## Estructura: dos apps independientes (NO monorepo)

`apps/web` y `apps/api` son proyectos **autónomos**: se instalan, corren, testean y
versionan por separado. No hay workspace raíz que los orqueste. Siempre `cd` a la app
antes de trabajar en ella. El gestor de paquetes es **pnpm**.

```
apps/
├── web/      Frontend Next.js 16 (App Router, Tailwind v4, TS, alias @/*, src/)
├── api/      Backend NestJS 11 (TypeScript)
└── docker/   Base de datos PostgreSQL 16 (Docker Compose)
```

> Los `pnpm-workspace.yaml` dentro de `apps/web` (lo pide Vercel al desplegar) y
> `apps/api` (settings de pnpm: `allowBuilds` para los engines de Prisma) son
> intencionales — no los borres pese a que "no es monorepo".

## Comandos

**Web** (`cd apps/web`):
- `pnpm dev` — servidor de desarrollo (localhost:3000)
- `pnpm build` / `pnpm start` — build y sirve producción
- `pnpm lint`

**API** (`cd apps/api`):
- `pnpm run start:dev` — desarrollo watch (localhost:4000)
- `pnpm run build` / `pnpm run start:prod`
- `pnpm run lint` — ESLint con `--fix`
- `pnpm run test` — Jest (unit) · `pnpm run test:e2e` — end-to-end
- Un solo test: `pnpm run test -- <patrón>` (p. ej. `pnpm run test -- ventas.service`)

**Docker** (`cd apps/docker`):
- `docker compose up -d db` — levanta solo Postgres (suficiente para desarrollo
  con `start:dev` en el host).
- `docker compose up -d --build` — levanta Postgres + API dockerizada
  (`apps/api/Dockerfile`) + web dockerizada (`apps/web/Dockerfile`;
  Next `output: standalone`, `API_PROXY_URL` se inyecta como
  build arg y fija el destino interno del rewrite `/api/*`) + túnel Cloudflare
  (`cloudflared`, único punto de entrada: quick tunnel por defecto con URL
  aleatoria en sus logs, o túnel con dominio propio vía `TUNNEL_TOKEN`).
  Ningún servicio publica puertos al host; el override `docker-compose.dev.yml`
  publica BD, web (3000) y API (4000). Al arrancar, el contenedor de la API corre
  `prisma migrate deploy` y luego siembra según `SEED_MODE` (`none` default ·
  `base` solo admin · `demo` base + datos de demo). El seed está en dos capas:
  `prisma/seed/base.ts` (requerido) y `prisma/seed/demo.ts`; desde el host,
  `pnpm prisma db seed` respeta `SEED_MODE` (default `demo`).
- Credenciales en `.env.example`. El `.env` real está gitignored. El override
  `docker-compose.dev.yml` publica los puertos al host (se activa vía
  `COMPOSE_FILE` en `.env`).

## Arquitectura

N-capas: Presentación (Next.js) → API REST → Lógica de negocio y acceso a datos
(NestJS, un módulo por dominio) → PostgreSQL. El navegador solo habla con la web
(mismo origen, `/api/*`); Next reenvía a la API vía rewrite (`API_PROXY_URL`,
default `http://localhost:4000`). La API se conecta a Postgres vía `DATABASE_URL`
(host `db` dentro de Docker, `localhost` en local).

Dominios de negocio (módulos NestJS planificados): `auth`, `usuarios`, `clientes`,
`proveedores`, `ventas`, `inventario`, `lotes`, `reportes`. Reglas transversales:
bajas **lógicas** (nunca borrado físico, se preserva historial), stock en tiempo real,
y lógica **FEFO** (first-expired-first-out) para descontar lotes por vencimiento.

Estado actual: ambas apps son **scaffolds recién inicializados**, sin código de
negocio aún. El trabajo comprometido está en [`docs/logbook/roadmap.md`](docs/logbook/roadmap.md)
(RM-004…RM-013, mapeados a los casos de uso CU01–CU09).

## Gotcha: versión de Next.js

`apps/web` usa Next.js 16, con cambios de API respecto a versiones previas. Antes de
escribir código de frontend, revisa las guías en `apps/web/node_modules/next/dist/docs/`
y atiende los avisos de deprecación (ver `apps/web/AGENTS.md`).

## Bitácora (logbook)

El seguimiento vive en `docs/logbook/`: `roadmap.md` (RM, comprometido),
`technical-debt.md` (TD, lo que está mal ahora), `wishlist.md` (WL, ideas), y
`changelog.md` (terminado). La deuda técnica se registra ahí, **nunca como comentario
en el código**. Al terminar una tarea comprometida, muévela al changelog conservando su
código. Los códigos nunca se reutilizan. Mecánica completa: skill `/logbook`.
