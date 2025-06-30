/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `nombre` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "cantidadValoraciones" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "documento" INTEGER,
ADD COLUMN     "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fotoPerfil" TEXT,
ADD COLUMN     "librosComprados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "librosFavoritos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "librosVendidos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "logros" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "puntuacionVendedor" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "ubicacion" TEXT;

-- CreateTable
CREATE TABLE "Lectura" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "libroId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "resenaTexto" TEXT,
    "valoracion" INTEGER,

    CONSTRAINT "Lectura_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Lectura" ADD CONSTRAINT "Lectura_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
