-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "ruc" VARCHAR(11) NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "asesorNombre" TEXT,
    "asesorTelefono" TEXT,
    "asesorEmail" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_ruc_key" ON "proveedores"("ruc");
