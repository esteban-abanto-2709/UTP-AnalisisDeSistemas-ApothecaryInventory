# Roadmap

Trabajo comprometido: lo que sí se va a hacer. Código `RM-###` (nunca se reutiliza).
Al terminar una tarea se mueve al changelog y se borra de aquí.

**Formato de cada entrada:**
- **Objetivo:** qué se quiere lograr.
- **Hecho cuando:** criterio claro de finalización.
- **Fecha** y **Estado** (Abierto / En progreso).

---

## [RM-008] Gestión de lotes con vencimientos y FEFO (CU09)
- **Objetivo:** registro de lotes por medicamento con fecha de vencimiento, control de stock por lote, descuentos por vencimiento próximo y lógica FEFO.
- **Hecho cuando:** se registran/editan/desactivan lotes, se aplican descuentos por lote y las ventas descuentan siguiendo FEFO; código de lote único por producto.
- **Fecha:** 2026-07-07 · **Estado:** Abierto

## [RM-009] Gestión de clientes (CU07)
- **Objetivo:** CRUD de clientes (DNI/RUC, razón social, contacto) para agilizar la facturación, con baja lógica.
- **Hecho cuando:** vendedor/admin registran, editan, desactivan y buscan clientes; documento duplicado se rechaza; los clientes quedan invocables desde ventas.
- **Fecha:** 2026-07-07 · **Estado:** Abierto

## [RM-010] Gestión de proveedores (CU08)
- **Objetivo:** CRUD de laboratorios y distribuidores (RUC, razón social, contacto del asesor), con baja lógica.
- **Hecho cuando:** el administrador registra, edita, desactiva y busca proveedores; RUC duplicado se rechaza.
- **Fecha:** 2026-07-07 · **Estado:** Abierto

## [RM-011] Gestión de ventas (CU02)
- **Objetivo:** registro de ventas en mostrador (carrito, cliente, comprobante, método de pago), descuento de stock en tiempo real e historial de ventas (historial solo administrador).
- **Hecho cuando:** una venta persiste, descuenta stock al instante, genera comprobante y valida stock insuficiente; el admin visualiza el historial filtrable; soporta "Cliente Varios".
- **Fecha:** 2026-07-07 · **Estado:** Abierto

## [RM-012] Reportes y exportación (CU04)
- **Objetivo:** reportes de ventas diarias y rotación de productos por rango de fechas, exportables a PDF/Excel.
- **Hecho cuando:** el admin genera reportes con filtros de fecha, los visualiza en tablas y los exporta; se manejan rango inválido y periodo sin registros.
- **Fecha:** 2026-07-07 · **Estado:** Abierto

## [RM-013] Panel de control con alertas de stock mínimo (CU05)
- **Objetivo:** dashboard con indicadores en tiempo real y alertas automáticas de productos en/bajo su stock mínimo.
- **Hecho cuando:** al cargar el panel se calculan indicadores y se listan las alertas de stock crítico; permite refrescar los datos.
- **Fecha:** 2026-07-07 · **Estado:** Abierto
