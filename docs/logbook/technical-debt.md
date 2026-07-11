# Deuda técnica

Lo que está **mal ahora** en el código existente. Código `TD-###` (nunca se reutiliza).
Al resolverse, la entrada se mueve al changelog conservando su código.

---

## [TD-001] Valores de desarrollo en la autenticación
- **Ubicación:** `apps/api/prisma/seed.ts:12` · `apps/api/.env.example` · `apps/api/src/auth/auth.controller.ts:15`
- **Riesgo:** 6/10
- **Problema:** el seed crea el admin con credenciales fijas (`12345678` / `Admin123`), el `JWT_SECRET` de ejemplo es un placeholder débil, y la cookie de sesión no lleva `secure` (válido en HTTP local, inseguro tras HTTPS).
- **Impacto futuro:** si se despliega tal cual, cualquiera con acceso al repo conoce el admin inicial y puede forjar sesiones; la cookie viajaría en claro fuera de la red local.
- **Fecha:** 2026-07-10 · **Estado:** Abierto
