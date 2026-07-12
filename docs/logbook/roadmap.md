# Roadmap

Trabajo comprometido: lo que sí se va a hacer. Código `RM-###` (nunca se reutiliza).
Al terminar una tarea se mueve al changelog y se borra de aquí.

**Formato de cada entrada:**
- **Objetivo:** qué se quiere lograr.
- **Hecho cuando:** criterio claro de finalización.
- **Fecha** y **Estado** (Abierto / En progreso).

---

## [RM-012] Reportes y exportación (CU04)
- **Objetivo:** reportes de ventas diarias y rotación de productos por rango de fechas, exportables a PDF/Excel.
- **Hecho cuando:** el admin genera reportes con filtros de fecha, los visualiza en tablas y los exporta; se manejan rango inválido y periodo sin registros.
- **Fecha:** 2026-07-07 · **Estado:** Abierto


## [RM-019] Cerrar puertos 3000/4000 en despliegue
- **Objetivo:** que en producción solo quede expuesto el punto de entrada web; API y BD solo en la red interna de Docker (el navegador ya habla únicamente con la web vía `/api/*`).
- **Hecho cuando:** los `ports:` de `web` y `api` se mueven de `docker-compose.yml` al override `docker-compose.dev.yml` (mismo patrón que la BD) y el stack completo funciona con login y CRUDs sin puertos publicados salvo el del frontal.
- **Fecha:** 2026-07-12 · **Estado:** Abierto
