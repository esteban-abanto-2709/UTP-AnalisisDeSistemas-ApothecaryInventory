# Sistema de Gestión de Inventarios y Ventas — Botica Conquistadores Farma S.A.C.

Software de gestión de inventarios y ventas para una botica que hoy opera con hojas
de cálculo manuales. El objetivo es centralizar la información, mantener el stock
actualizado **en tiempo real** y eliminar los errores del registro manual.

> Proyecto académico del curso **Análisis y Diseño de Sistemas de Información** —
> Universidad Tecnológica del Perú (UTP), 2026.

---

## El problema

Botica Conquistadores Farma S.A.C. (Lurigancho-Chosica) controla su inventario con
hojas de cálculo descentralizadas, sin integración entre ventas y almacén. Esto causa:

- **Quiebres de stock** por falta o por exceso: la disponibilidad no se conoce al momento.
- **Desfase de hasta 24 h**: el inventario se cuadra recién al cierre de la jornada.
- **Colas y demoras** en horas pico, porque el vendedor consulta el almacén físicamente.
- **Errores humanos** en el registro de ventas y en el conteo de existencias.

## La solución

Una plataforma web donde vendedor y administrador operan sobre una misma base de datos.
Una venta descuenta el stock al instante y esa realidad queda visible para todos, con
alertas de stock mínimo y control de vencimientos por lote.

### Objetivo

Optimizar el control de stock en tiempo real, mejorar la gestión de productos y reducir
los errores asociados a los procesos manuales.

## Roles

| Rol | Qué hace |
|---|---|
| **Vendedor** | Atención en mostrador: registra ventas, busca productos, consulta stock y gestiona clientes. |
| **Administrador** | Control total: inventario, lotes, proveedores, usuarios, reportes y panel de alertas. |

## Módulos

| Módulo | Descripción |
|---|---|
| Autenticación | Ingreso por credenciales con acceso restringido según rol (RBAC). |
| Ventas | Registro de ventas en mostrador e historial (historial solo administrador). |
| Inventario | Alta/edición/baja lógica de productos y consulta de stock en tiempo real. |
| Lotes | Control de lotes, fechas de vencimiento y descuentos por proximidad (lógica FEFO). |
| Clientes | Registro de clientes para agilizar la facturación. |
| Proveedores | Laboratorios y distribuidores que abastecen el negocio. |
| Usuarios | Gestión de cuentas y roles del personal. |
| Reportes | Ventas diarias, rotación de productos, exportables a PDF/Excel. |
| Panel de control | Dashboard con indicadores y alertas automáticas de stock mínimo. |

## Alcance

**Incluye:** inventario en tiempo real, ventas en mostrador, clientes, proveedores,
lotes con vencimientos, control de accesos, alertas de stock y reportes.

**No incluye:** contabilidad/finanzas detalladas, planillas y pago de salarios, logística
de delivery externo, y protocolos sanitarios para desecho de medicamentos vencidos.

## Arquitectura

Dos aplicaciones **independientes** que se comunican por una API REST, más una base de
datos PostgreSQL. Cada app tiene su propio ciclo de vida y su propio README técnico.

```
Navegador ──HTTP──> Web (Next.js) ──REST──> API (NestJS) ──SQL──> PostgreSQL
```

Diseño en N-capas: Presentación (Next.js) · Lógica de negocio y acceso a datos
(NestJS) · Persistencia (PostgreSQL). Todo orquestable con Docker.

## Estructura del repositorio

```
.
├── apps/
│   ├── web/      Frontend Next.js   → ver apps/web/README.md
│   ├── api/      Backend NestJS      → ver apps/api/README.md
│   └── docker/   Base de datos (Postgres) en Docker Compose
└── docs/
    └── logbook/  Bitácora del proyecto (roadmap, deuda técnica, wishlist, changelog)
```

> `web` y `api` son proyectos autónomos, **no un monorepo**: se instalan, corren y
> versionan por separado. Consulta el README de cada uno para el detalle técnico.

## Stack

- **Frontend:** Next.js (React) + Tailwind CSS + TypeScript
- **Backend:** NestJS (Node.js) + TypeScript
- **Base de datos:** PostgreSQL 16
- **Infraestructura:** Docker + Docker Compose
- **Gestor de paquetes:** pnpm

## Equipo

Proyecto desarrollado para el curso Análisis y Diseño de Sistemas de Información (UTP).

- Nicolás Alberto Suárez Montalvo
- Gabriel Anthony Miñano Calderón
- Wilder Esteban Abanto García
- Jahn Carlo Yarleque Carrillo
- Manuel Sebastián Arrestegui Olaya

Docente: Elvis Wilson Alcántara Pinedo.
