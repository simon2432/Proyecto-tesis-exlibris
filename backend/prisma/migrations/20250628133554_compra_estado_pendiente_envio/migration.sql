-- CreateEnum
CREATE TYPE "EstadoPublicacion" AS ENUM ('activa', 'en_venta');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('pendiente_pago', 'pendiente_envio', 'en_camino', 'completado');

-- CreateTable
CREATE TABLE "Publicacion" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "editorial" TEXT NOT NULL,
    "paginas" INTEGER NOT NULL,
    "idioma" TEXT NOT NULL,
    "estadoLibro" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "imagenUrl" TEXT NOT NULL,
    "fechaPublicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendedorId" INTEGER NOT NULL,
    "estado" "EstadoPublicacion" NOT NULL DEFAULT 'activa',

    CONSTRAINT "Publicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" SERIAL NOT NULL,
    "compradorId" INTEGER NOT NULL,
    "publicacionId" INTEGER NOT NULL,
    "estado" "EstadoCompra" NOT NULL DEFAULT 'pendiente_pago',
    "fechaCompra" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Publicacion" ADD CONSTRAINT "Publicacion_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "Publicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
