# API — Botica Conquistadores Farma

Backend REST del sistema de gestión de inventarios y ventas, construido con **NestJS**.
Expone la lógica de negocio (ventas, inventario, lotes, reportes, etc.) y persiste en
PostgreSQL. Forma parte del proyecto general — ver el
[README raíz](../../README.md) para el contexto y el alcance.

## Requisitos

- Node.js LTS
- pnpm
- PostgreSQL (recomendado vía Docker, ver [`apps/docker`](../docker))

## Puesta en marcha

```bash
pnpm install

# Levanta la base de datos (desde apps/docker)
cd ../docker && docker compose up -d db && cd -

# Desarrollo (watch)
pnpm run start:dev
```

La API queda en `http://localhost:4000` (configurable con `PORT`).

## Variables de entorno

La API se conecta a la Postgres del Docker Compose. En desarrollo local usa estas
variables (crea un `.env` en esta carpeta si corres fuera de Docker):

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto HTTP de la API | `4000` |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://apothecary:apothecary@localhost:5432/apothecary_db` |

> Dentro de Docker Compose el host de la BD es `db`; en local es `localhost`. Las
> credenciales por defecto viven en [`apps/docker/.env.example`](../docker/.env.example).

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm run start:dev` | Desarrollo con recarga en caliente |
| `pnpm run start:prod` | Producción (requiere `build` previo) |
| `pnpm run build` | Compila a `dist/` |
| `pnpm run test` | Pruebas unitarias |
| `pnpm run test:e2e` | Pruebas end-to-end |
| `pnpm run lint` | ESLint |

## Arquitectura

Diseño en **N-capas** sobre la estructura modular de NestJS:

- **Presentación** → la consume el frontend (Next.js) vía API REST.
- **Lógica de negocio** → controladores y servicios de NestJS.
- **Acceso a datos** → repositorios (ORM).
- **Persistencia** → PostgreSQL.

### Módulos planificados

Un módulo por dominio, cada uno con su controlador, servicio y entidad:

| Módulo | Responsabilidad |
|---|---|
| `auth` | Autenticación y control de acceso por rol (RBAC). |
| `usuarios` | CRUD del personal (vendedores y administradores). |
| `clientes` | CRUD de clientes para facturación. |
| `proveedores` | CRUD de laboratorios y distribuidores. |
| `ventas` | Registro de ventas, descuento de stock e historial. |
| `inventario` | Productos y stock en tiempo real. |
| `lotes` | Lotes, vencimientos y descuentos (lógica FEFO). |
| `reportes` | Consolidados de ventas y rotación, exportables. |

> Estado actual: proyecto recién inicializado (scaffold de NestJS). Los módulos de
> negocio se irán construyendo según el [roadmap](../../docs/logbook/roadmap.md).

## Modelo de datos

El esquema físico (PostgreSQL) contempla las entidades: `administrador`, `empleado`,
`cliente`, `medicamento`, `lote`, `registro_venta`, `detalle_venta` y
`detalle_descuento_lote`, con restricciones de integridad (stock no negativo, unicidad
de documentos) e índices para las búsquedas FEFO y alertas de reposición.
