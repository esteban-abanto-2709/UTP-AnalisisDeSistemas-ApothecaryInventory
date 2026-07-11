# Changelog

Registro permanente de todo el trabajo terminado. Indexado por código de tarea
(`TD-`, `RM-`, `WL-`). Orden inverso: lo más nuevo arriba.

**Formato de cada entrada:**

```
## [CÓDIGO] Título (YYYY-MM-DD HH:MM)
Resumen en ≤2 líneas de lo que se hizo.
```

---

## [RM-009] Gestión de clientes (CU07) (2026-07-11 12:16)
Modelo `Cliente` (tipoDocumento DNI/RUC, numeroDocumento único, nombre/razón social, teléfono/dirección/email opcionales, baja lógica) y módulo `clientes` abierto a vendedor y admin: `GET /clientes?q=` (busca por documento o nombre), `GET /clientes/documento/:numero` para autocompletar en la venta (404 si es nuevo → alta manual), POST con validación de longitud (DNI 8, RUC 11) y 409 por documento duplicado, PATCH edita contacto/nombre/estado (documento inmutable). Integración RENIEC/SUNAT queda en WL-004. Tests y build verdes; modelo verificado contra Postgres vía seed.

## [RM-008] Gestión de lotes con vencimientos y FEFO (CU09) (2026-07-11 10:50)
Modelo `Lote` (código único por medicamento, vencimiento, stock inicial/actual, descuento %, baja lógica; CHECKs de rango) y módulo `lotes` (`/lotes` solo ADMINISTRADOR: alta que suma stock, edición/desactivación que lo ajusta, todo transaccional). El stock del medicamento pasa a derivarse de lotes (cacheado, ya no editable a mano) y `LotesService.descontarFEFO` implementa el descuento por vencimiento reutilizable; su cableado a ventas queda para RM-011. Verificado end-to-end contra Postgres; tests y lint verdes.

## [RM-016] Seed en dos capas con SEED_MODE (2026-07-11 10:30)
Seed dividido en `prisma/seed/base.ts` (admin, requerido) y `prisma/seed/demo.ts` (vendedores + medicamentos); `prisma/seed.ts` despacha según `SEED_MODE` (`none`/`base`/`demo`). El contenedor de la API ahora corre `prisma migrate deploy` + seed al arrancar vía `docker-entrypoint.sh` (seed compilado a `dist-seed/`, CLI de prisma movido a dependencias de producción, `allowBuilds` para los engines). Verificado: arranque limpio con migrate + seed demo, health y login OK.

## [RM-015] Dockerización de la API (2026-07-11 09:50)
`Dockerfile` multi-stage en `apps/api` (build con prisma generate + nest build; runtime solo deps de producción y `dist/`) y servicio `api` en el compose de `apps/docker` (puerto 4000, `depends_on` db healthy, `DATABASE_URL` armada desde las vars de Postgres). Migraciones y seed siguen corriéndose desde el host. Verificado: `/health` y login OK desde el contenedor.

## [RM-014] Datos seed de demo (2026-07-11 09:15)
Ampliado `apps/api/prisma/seed.ts`: 5 empleados (admin + 4 vendedores, `Demo1234`) y 15 medicamentos con precios/stock variados (uno con stock 0). Idempotente vía upsert; se ejecuta con `pnpm prisma db seed`.

## [RM-007] Gestión de inventario / productos (CU03) (2026-07-10 23:58)
Modelo `Medicamento` en Prisma (nombre único, precio, stock, baja lógica; CHECKs de stock/precio no negativos) y módulo `inventario` en NestJS (`/productos`: GET para todo autenticado, POST/PATCH solo ADMINISTRADOR, 409 por nombre duplicado). Página `/productos` con búsqueda en vivo, tabla de stock y mantenimiento visible solo para admin. Verificado end-to-end; tests y lint verdes en ambas apps.

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
