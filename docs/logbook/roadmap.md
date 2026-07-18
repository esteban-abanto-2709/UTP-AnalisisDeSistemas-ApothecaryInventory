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
- **Alcance pendiente:** falta todo — no hay módulo `reportes` en la API ni página en la web (el sidebar la marca "Pronto", RM-018).
- **Fecha:** 2026-07-07 · **Estado:** Abierto

## [RM-022] Límites de longitud y validación de entrada en formularios
- **Objetivo:** aplicar el feedback de `docs/Acotaciones.docx`. Hoy ningún DTO usa `@MaxLength` ni ningún input tiene `maxLength`, así que cualquier texto largo se guarda y desborda las tablas.
- **Hecho cuando:** cada campo de la tabla de abajo tiene su límite en el DTO y el mismo `maxLength` en su input, y las celdas de tabla truncan en vez de desbordar.
- **Fecha:** 2026-07-18 · **Estado:** Abierto

**Límites a aplicar** (el DTO manda, el input copia el número; sin migración — validación en DTO, no `@db.VarChar`):

| Módulo | Campo | Límite |
|---|---|---|
| Inventario | `nombre` | máx. 100 |
| Inventario | `precio` | máx. 99999.99 |
| Inventario | `stockMinimo` | máx. 9999 |
| Clientes | `nombre` | máx. 150 |
| Clientes | `telefono` | máx. 20, solo `0-9 + - # ( ) espacio` |
| Clientes | `direccion` | máx. 200 |
| Clientes | `email` | máx. 120 |
| Proveedores | `razonSocial` | máx. 200 |
| Proveedores | `asesorNombre` | máx. 100 |
| Proveedores | `asesorTelefono` | máx. 20, misma lista blanca |
| Proveedores | `asesorEmail` | máx. 120 |
| Usuarios | `nombre` | máx. 100, sin dígitos (permite tildes, `'`, `-`, espacio) |
| Usuarios | `password` | 6–72 (tope de bcrypt) |
| Punto de venta | documento del cliente | input solo dígitos, máx. 11 |

**Descartado:** obligar `stockMinimo < stock`. La alerta de reposición es `stock <= stockMinimo` (`dashboard.service.ts:24`), así que la regla la anularía; además todo producto nace con `stock = 0` (deriva de lotes, RM-008) y bloquearía el alta.

**Fuera de alcance:** "no hay campo de stock en inventario" — es por diseño desde RM-008; lo resuelve la pantalla de lotes (RM-021).
