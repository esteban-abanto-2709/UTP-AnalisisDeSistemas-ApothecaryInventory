# Wishlist

Ideas y mejoras posibles, sin compromiso (quizá nunca). Código `WL-###` (nunca se reutiliza).
Si una idea se promueve, se borra de aquí y nace un `RM` nuevo.

**Formato:** título + idea en 1–2 líneas, sin campos.

---

## [WL-001] Integración con lector de código de barras e impresora térmica
Agilizar la caja: escanear productos en la venta y emitir el comprobante en ticketera térmica en lugar de digitar y imprimir en papel común.

## [WL-002] Comprobantes electrónicos válidos ante SUNAT
Emitir boletas/facturas formales (no solo comprobantes internos), con la integración fiscal correspondiente.

## [WL-003] Consulta pública de disponibilidad de productos
Permitir que los clientes verifiquen el stock desde fuera del local antes de acercarse (necesidad detectada en el cuestionario a clientes).

## [WL-004] Autocompletar cliente desde RENIEC/SUNAT por documento
Al teclear DNI/RUC en la venta y no existir el cliente, consultar un servicio externo (RENIEC para DNI, SUNAT para RUC) para traer nombre/razón social y dirección automáticamente, en vez de digitarlos a mano. Requiere API key y proveedor externo. Base ya lista: `GET /clientes/documento/:numero` (RM-009).
