# Concepto del Proyecto

Documento de fondo del sistema de gestión de inventarios y ventas para **Botica
Conquistadores Farma S.A.C.** Amplía el [README raíz](../README.md) con el detalle
conceptual del negocio, los procesos, los requerimientos y el diseño, sin llegar al
nivel de los entregables académicos completos.

---

## 1. La empresa

- **Razón social:** Botica Conquistadores Farma S.A.C.
- **Ubicación:** Prol. 28 de Julio 140, Lurigancho-Chosica, Lima.
- **Rubro:** venta minorista de medicamentos, insumos médicos y cuidado personal.

Es un negocio con clientela constante y ubicación estratégica, pero que opera con un
modelo de gestión basado en **hojas de cálculo descentralizadas**, sin integración
entre áreas.

## 2. El problema

La gestión manual del inventario genera un flujo de información deficiente:

- Cuando se vende un producto, el stock **no se actualiza al instante** para el resto
  del personal → inconsistencias en la disponibilidad.
- En horas pico, varias cajas piden el mismo producto sin conocer el estado real del
  almacén → desplazamientos innecesarios, colas y fatiga.
- El inventario se cuadra **al cierre de la jornada**: desfase de hasta 24 horas.
- Registro de ventas y conteo de stock manuales → **errores humanos** frecuentes.

El resultado es pérdida de rentabilidad (quiebres por falta o exceso de stock) y peor
calidad de servicio.

## 3. Objetivos

**General:** desarrollar un sistema de gestión de inventarios que optimice el control
de stock en tiempo real, mejore la gestión de productos y reduzca los errores del
proceso manual.

**Específicos:**

- Centralizar y automatizar el registro de productos, ventas y movimientos.
- Garantizar la actualización del inventario en tiempo real.
- Integrar la información entre ventas y almacén.
- Detectar bajo stock y generar alertas oportunas de reposición.
- Reducir tiempos de atención al cliente.
- Generar reportes que apoyen la toma de decisiones.

## 4. Actores

| Actor | Rol en el sistema |
|---|---|
| **Vendedor** | Atención en mostrador: registra ventas, busca productos, consulta stock, gestiona clientes. |
| **Administrador** | Control total: inventario, lotes, proveedores, usuarios, reportes y panel de alertas. Puede vender. |

Actores del negocio adicionales (no operan el sistema directamente): **Cliente** (compra)
y **Proveedor** (abastece).

## 5. Del proceso actual al propuesto

**Hoy (manual):** el vendedor recibe el pedido → verifica disponibilidad físicamente o
en hojas → registra la venta a mano → cobra y entrega → el inventario se actualiza recién
al cierre del día. Sin sincronización en tiempo real.

**Propuesto (sistema):** vendedor y administrador operan sobre una misma base de datos.
Una venta **descuenta el stock al instante** y esa realidad queda visible para todos, con
validación de stock insuficiente, alertas de stock mínimo y control de vencimientos por
lote (lógica FEFO — *first expired, first out*).

## 6. Módulos y casos de uso

| # | Caso de uso | Actor principal | Qué resuelve |
|---|---|---|---|
| CU01 | Iniciar sesión | Vendedor / Admin | Autenticación y acceso por rol (RBAC). |
| CU02 | Gestionar ventas | Vendedor / Admin | Registro de ventas, descuento de stock, historial (historial solo admin). |
| CU03 | Gestionar inventario | Admin (Vendedor consulta) | CRUD de productos y stock en tiempo real. |
| CU04 | Gestionar reportes | Admin | Ventas diarias, rotación, exportación PDF/Excel. |
| CU05 | Consultar panel de control | Admin | Dashboard con indicadores y alertas de stock mínimo. |
| CU06 | Gestionar usuarios | Admin | CRUD del personal y sus roles. |
| CU07 | Gestionar clientes | Vendedor / Admin | CRUD de clientes para facturación. |
| CU08 | Gestionar proveedores | Admin | CRUD de laboratorios y distribuidores. |
| CU09 | Gestionar lotes | Admin | Lotes, vencimientos y descuentos por proximidad. |

Todas las bajas son **lógicas** (estado inactivo): nunca se destruye el historial de
transacciones.

## 7. Requerimientos no funcionales

- **Seguridad — cifrado:** contraseñas almacenadas con hash seguro (bcrypt/argon2).
- **Seguridad — autorización:** RBAC estricto entre Vendedor y Administrador; rutas
  internas cerradas a no autenticados.
- **Usabilidad:** interfaz intuitiva y responsiva, operaciones con mínimos clics.
- **Rendimiento:** consultas críticas de stock, búsquedas y reportes en < 2 s.
- **Disponibilidad:** alta disponibilidad durante la jornada comercial.
- **Mantenibilidad:** arquitectura modular en capas, escalable.

## 8. Modelo de datos (conceptual)

Entidades núcleo y sus relaciones:

- **Cliente** realiza **Ventas**; cada venta la registra un **Empleado**.
- Una **Venta** contiene uno o varios **Detalles de Venta** (los productos vendidos).
- Un **Medicamento** se administra mediante **Lotes** (stock y fecha de vencimiento).
- **DetalleDescuentoLote** vincula el detalle de venta con el lote del que se descontó
  (soporte para FEFO y descuentos por lote).
- El **Administrador** gestiona a los **Empleados**.

El esquema físico (PostgreSQL) aplica integridad referencial, restricciones `CHECK`
(stock nunca negativo ni mayor al original), unicidad de documentos e índices sobre
vencimiento y stock para acelerar FEFO y alertas.

## 9. Arquitectura

Diseño en **N-capas**, desplegable con Docker:

```
Navegador ──HTTP──> Web (Next.js) ──REST──> API (NestJS) ──ORM/SQL──> PostgreSQL
```

- **Presentación:** Next.js (páginas y componentes UI).
- **Lógica de negocio:** NestJS (controladores y servicios), un módulo por dominio.
- **Acceso a datos:** repositorios sobre ORM.
- **Persistencia:** PostgreSQL.

Web y API son **aplicaciones independientes** (no monorepo), cada una con su README
técnico. La operación diaria de la botica funciona en red local, sin depender de Internet.

## 10. Alcance

**Incluye:** inventario en tiempo real, ventas en mostrador, clientes, proveedores,
lotes con vencimientos, control de accesos, alertas de stock y reportes.

**No incluye:** contabilidad/finanzas detalladas, planillas y salarios, logística de
delivery externo, y protocolos sanitarios para desecho de medicamentos vencidos.

---

> El seguimiento operativo (qué está hecho, qué falta, ideas) vive en
> [`docs/logbook/`](./logbook/). Este documento es la referencia conceptual estable.
