-- CreateTable
CREATE TABLE "medicamentos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicamentos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "medicamentos_stock_no_negativo" CHECK ("stock" >= 0),
    CONSTRAINT "medicamentos_precio_no_negativo" CHECK ("precio" >= 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "medicamentos_nombre_key" ON "medicamentos"("nombre");
