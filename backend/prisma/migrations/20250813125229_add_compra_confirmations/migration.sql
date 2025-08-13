-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoCompra" ADD VALUE 'comprador_confirmado';
ALTER TYPE "EstadoCompra" ADD VALUE 'vendedor_confirmado';

-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "compradorConfirmado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendedorConfirmado" BOOLEAN NOT NULL DEFAULT false;
