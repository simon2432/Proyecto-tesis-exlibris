/*
  Warnings:

  - The values [pendiente_pago,pendiente_envio] on the enum `EstadoCompra` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `precio` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoEntrega` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendedorId` to the `Compra` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('envio', 'encuentro');

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoCompra_new" AS ENUM ('pago_pendiente', 'encuentro', 'en_camino', 'completado');
ALTER TABLE "Compra" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Compra" ALTER COLUMN "estado" TYPE "EstadoCompra_new" USING ("estado"::text::"EstadoCompra_new");
ALTER TYPE "EstadoCompra" RENAME TO "EstadoCompra_old";
ALTER TYPE "EstadoCompra_new" RENAME TO "EstadoCompra";
DROP TYPE "EstadoCompra_old";
ALTER TABLE "Compra" ALTER COLUMN "estado" SET DEFAULT 'pago_pendiente';
COMMIT;

-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "precio" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tipoEntrega" "TipoEntrega" NOT NULL,
ADD COLUMN     "vendedorId" INTEGER NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'pago_pendiente';

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
