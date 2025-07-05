/*
  Warnings:

  - You are about to drop the column `resenaTexto` on the `Lectura` table. All the data in the column will be lost.
  - You are about to drop the column `valoracion` on the `Lectura` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lectura" DROP COLUMN "resenaTexto",
DROP COLUMN "valoracion",
ADD COLUMN     "reviewComment" TEXT,
ADD COLUMN     "reviewRating" INTEGER;
