-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('BOLETA', 'FACTURA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'YAPE_PLIN');

-- CreateTable
CREATE TABLE "ventas" (
    "id" SERIAL NOT NULL,
    "tipoComprobante" "TipoComprobante" NOT NULL,
    "serie" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "clienteId" INTEGER,
    "empleadoId" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ventas_numero_positivo" CHECK ("numero" > 0),
    CONSTRAINT "ventas_total_no_negativo" CHECK ("total" >= 0)
);

-- CreateTable
CREATE TABLE "detalles_venta" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "medicamentoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalles_venta_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "detalles_venta_cantidad_positiva" CHECK ("cantidad" > 0),
    CONSTRAINT "detalles_venta_precio_no_negativo" CHECK ("precioUnitario" >= 0),
    CONSTRAINT "detalles_venta_subtotal_no_negativo" CHECK ("subtotal" >= 0)
);

-- CreateTable
CREATE TABLE "detalles_descuento_lote" (
    "id" SERIAL NOT NULL,
    "detalleVentaId" INTEGER NOT NULL,
    "loteId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "descuento" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "detalles_descuento_lote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "detalles_descuento_lote_cantidad_positiva" CHECK ("cantidad" > 0),
    CONSTRAINT "detalles_descuento_lote_descuento_rango" CHECK ("descuento" >= 0 AND "descuento" <= 100)
);

-- CreateIndex
CREATE INDEX "ventas_createdAt_idx" ON "ventas"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_serie_numero_key" ON "ventas"("serie", "numero");

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_descuento_lote" ADD CONSTRAINT "detalles_descuento_lote_detalleVentaId_fkey" FOREIGN KEY ("detalleVentaId") REFERENCES "detalles_venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_descuento_lote" ADD CONSTRAINT "detalles_descuento_lote_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
