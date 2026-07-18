# Deuda técnica

Lo que está **mal ahora** en el código existente. Código `TD-###` (nunca se reutiliza).
Al resolverse, la entrada se mueve al changelog conservando su código.

---

## [TD-001] Valores de desarrollo en la autenticación
- **Ubicación:** `apps/api/prisma/seed/base.ts:6` · `apps/api/.env.example` · `apps/api/src/auth/auth.controller.ts:15`
- **Riesgo:** 6/10
- **Problema:** el seed crea el admin con credenciales fijas (`12345678` / `Admin123`), el `JWT_SECRET` de ejemplo es un placeholder débil, y la cookie de sesión no lleva `secure` (válido en HTTP local, inseguro tras HTTPS).
- **Impacto futuro:** si se despliega tal cual, cualquiera con acceso al repo conoce el admin inicial y puede forjar sesiones; la cookie viajaría en claro fuera de la red local.
- **Fecha:** 2026-07-10 · **Estado:** Abierto

## [TD-002] Imagen Docker de la API con peers de desarrollo
- **Ubicación:** `apps/api/Dockerfile:9` · `apps/api/pnpm-lock.yaml`
- **Riesgo:** 2/10
- **Problema:** `pnpm install --prod` instala igualmente `@prisma/studio-core`, `typescript`, `react`, `effect` y `pglite` (~130MB) porque `@prisma/client` los declara como peers y el auto-install de peers los fijó en el lockfile. (El CLI `prisma` ya no cuenta: es dependencia de producción intencional, el entrypoint corre `migrate deploy`.)
- **Impacto futuro:** imagen final ~700MB en vez de ~570MB; solo costo de disco/transfer, ningún riesgo funcional.
- **Fecha:** 2026-07-11 · **Estado:** Abierto

## [TD-003] Ventas del seed demo no descuentan stock de lotes
- **Ubicación:** `apps/api/prisma/seed/demo.ts` (bloque `ventasDemo`)
- **Riesgo:** 2/10
- **Problema:** las 17 ventas de demo se insertan directo con Prisma, sin pasar por la lógica FEFO ni descontar `stockActual` de los lotes ni `stock` del medicamento; tampoco crean `DetalleDescuentoLote`.
- **Impacto futuro:** en la demo, el historial de ventas no cuadra con el stock mostrado (los lotes siguen con `stockInicial == stockActual`). Solo afecta coherencia de datos ficticios; ninguna pantalla actual lo evidencia.
- **Fecha:** 2026-07-16 · **Estado:** Abierto

## [TD-004] Los e2e ensucian la BD de desarrollo
- **Ubicación:** `apps/api/test/setup.ts` · `apps/api/test/*.e2e-spec.ts`
- **Riesgo:** 3/10
- **Problema:** los tests corren contra la misma BD de desarrollo y no limpian: cada ejecución deja empleados, productos, lotes, clientes y ventas con sufijo numérico. Se eligió así para no montar una BD aparte y poder re-ejecutar sin resembrar.
- **Impacto futuro:** tras muchas corridas, la demo se llena de basura y las pantallas dejan de ser presentables; se arregla resembrando (`SEED_MODE=demo`), pero conviene revisarlo si algún día se corren en CI.
- **Fecha:** 2026-07-18 · **Estado:** Abierto

## [TD-005] Aviso de deprecación de `pg` durante los e2e
- **Ubicación:** salida de `pnpm run test:e2e` (origen sin confirmar, probablemente el driver adapter de Prisma 7)
- **Riesgo:** 2/10
- **Problema:** cada corrida emite `Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0`. No se rastreó si nace de código propio (las transacciones de `ventas`/`lotes`) o de las entrañas de Prisma.
- **Impacto futuro:** si es código propio, al llegar `pg@9` fallarían las transacciones; si es de Prisma, se resuelve solo al actualizar. Vale confirmar el origen antes de subir `pg`.
- **Fecha:** 2026-07-18 · **Estado:** Abierto
