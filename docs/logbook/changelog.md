# Changelog

Registro permanente de todo el trabajo terminado. Indexado por código de tarea
(`TD-`, `RM-`, `WL-`). Orden inverso: lo más nuevo arriba.

**Formato de cada entrada:**

```
## [CÓDIGO] Título (YYYY-MM-DD HH:MM)
Resumen en ≤2 líneas de lo que se hizo.
```

---

## [RM-006] Gestión de usuarios (CU06) (2026-07-10 22:44)
Módulo `usuarios` en NestJS (listar, alta, edición con reset opcional de contraseña, baja lógica vía PATCH `activo`) solo para ADMINISTRADOR, con 409 por DNI duplicado y bloqueo de auto-desactivación; página `/usuarios` en la web con tabla y formulario. Sin cambios de schema (el modelo `Empleado` ya cubría todo). Verificado end-to-end; tests y lint verdes.

## [RM-005] Autenticación e inicio de sesión con RBAC (2026-07-10 22:26)
Login por DNI + contraseña (bcrypt) con JWT en cookie httpOnly: modelo `Empleado` + enum `Rol` en Prisma (migración `auth-empleados` + seed de admin), módulo `auth` en NestJS con guards globales (`AuthGuard` revalida `activo` en BD, `RolesGuard` por decorador) y en la web página `/login` + `proxy.ts` que protege rutas. Verificado end-to-end; tests y lint verdes en ambas apps.

## [RM-004] Conexión de la API a PostgreSQL con Prisma (2026-07-07 22:22)
Prisma 7 (generator `prisma-client` + adapter `@prisma/adapter-pg`) cableado a NestJS vía `PrismaModule`/`PrismaService` global, con schema vacío (solo conexión). Endpoint `GET /health` hace `SELECT 1` para verificar la BD. El modelado de entidades queda para las tareas de dominio (RM-006 en adelante). `pnpm build` verde.

## [RM-003] Documentación inicial del proyecto (2026-07-07 21:52)
README raíz conceptual (problema, alcance, módulos, arquitectura, equipo) y READMEs técnicos de `apps/web` y `apps/api`. Montado el logbook en `docs/logbook/`.

## [RM-002] Base de datos PostgreSQL en Docker Compose (2026-07-07)
Servicio `db` (Postgres 16) en `apps/docker` con healthcheck y volumen; `.env`/`.env.example` reducidos solo a la BD (tema `apothecary`), sin secretos heredados.

## [RM-001] Inicialización de apps web y api (2026-07-07)
Scaffold de `apps/web` (Next.js, App Router, Tailwind, TypeScript, alias `@/*`, `src/`) y `apps/api` (NestJS, TypeScript), ambos con pnpm.
