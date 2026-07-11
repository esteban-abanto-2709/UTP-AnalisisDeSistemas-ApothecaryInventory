-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('VENDEDOR', 'ADMINISTRADOR');

-- CreateTable
CREATE TABLE "empleados" (
    "id" SERIAL NOT NULL,
    "dni" VARCHAR(8) NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empleados_dni_key" ON "empleados"("dni");
