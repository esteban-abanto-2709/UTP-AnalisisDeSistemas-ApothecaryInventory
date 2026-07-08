# Changelog

Registro permanente de todo el trabajo terminado. Indexado por código de tarea
(`TD-`, `RM-`, `WL-`). Orden inverso: lo más nuevo arriba.

**Formato de cada entrada:**

```
## [CÓDIGO] Título (YYYY-MM-DD HH:MM)
Resumen en ≤2 líneas de lo que se hizo.
```

---

## [RM-004] Conexión de la API a PostgreSQL con Prisma (2026-07-07 22:22)
Prisma 7 (generator `prisma-client` + adapter `@prisma/adapter-pg`) cableado a NestJS vía `PrismaModule`/`PrismaService` global, con schema vacío (solo conexión). Endpoint `GET /health` hace `SELECT 1` para verificar la BD. El modelado de entidades queda para las tareas de dominio (RM-006 en adelante). `pnpm build` verde.

## [RM-003] Documentación inicial del proyecto (2026-07-07 21:52)
README raíz conceptual (problema, alcance, módulos, arquitectura, equipo) y READMEs técnicos de `apps/web` y `apps/api`. Montado el logbook en `docs/logbook/`.

## [RM-002] Base de datos PostgreSQL en Docker Compose (2026-07-07)
Servicio `db` (Postgres 16) en `apps/docker` con healthcheck y volumen; `.env`/`.env.example` reducidos solo a la BD (tema `apothecary`), sin secretos heredados.

## [RM-001] Inicialización de apps web y api (2026-07-07)
Scaffold de `apps/web` (Next.js, App Router, Tailwind, TypeScript, alias `@/*`, `src/`) y `apps/api` (NestJS, TypeScript), ambos con pnpm.
