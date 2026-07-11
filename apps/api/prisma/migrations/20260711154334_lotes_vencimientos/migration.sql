-- CreateTable
CREATE TABLE "lotes" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "medicamentoId" INTEGER NOT NULL,
    "fechaVencimiento" DATE NOT NULL,
    "stockInicial" INTEGER NOT NULL,
    "stockActual" INTEGER NOT NULL,
    "descuento" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lotes_stock_inicial_no_negativo" CHECK ("stockInicial" >= 0),
    CONSTRAINT "lotes_stock_actual_rango" CHECK ("stockActual" >= 0 AND "stockActual" <= "stockInicial"),
    CONSTRAINT "lotes_descuento_rango" CHECK ("descuento" >= 0 AND "descuento" <= 100)
);

-- CreateIndex
CREATE INDEX "lotes_medicamentoId_fechaVencimiento_idx" ON "lotes"("medicamentoId", "fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_medicamentoId_codigo_key" ON "lotes"("medicamentoId", "codigo");

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
