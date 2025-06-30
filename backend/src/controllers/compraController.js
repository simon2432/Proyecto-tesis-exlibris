const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.crearCompra = async (req, res) => {
  const compradorId = req.userId;
  const { publicacionId } = req.body;

  try {
    // Verificamos que exista la publicación y esté activa
    const publicacion = await prisma.publicacion.findUnique({
      where: { id: publicacionId },
    });

    if (!publicacion || publicacion.estado !== "activa") {
      return res
        .status(400)
        .json({ error: "La publicación no está disponible" });
    }

    // Cambiamos el estado de la publicación
    await prisma.publicacion.update({
      where: { id: publicacionId },
      data: { estado: "en_venta" },
    });

    // Creamos la compra
    const compra = await prisma.compra.create({
      data: {
        compradorId,
        publicacionId,
      },
      include: {
        publicacion: true,
      },
    });

    res.status(201).json(compra);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la compra" });
  }
};

exports.obtenerMisCompras = async (req, res) => {
  try {
    const compras = await prisma.compra.findMany({
      where: { compradorId: req.userId },
      include: {
        publicacion: {
          include: { vendedor: true },
        },
      },
      orderBy: { fechaCompra: "desc" },
    });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener mis compras" });
  }
};

exports.obtenerMisVentas = async (req, res) => {
  try {
    const ventas = await prisma.compra.findMany({
      where: {
        publicacion: {
          vendedorId: req.userId,
        },
      },
      include: {
        comprador: true,
        publicacion: true,
      },
      orderBy: { fechaCompra: "desc" },
    });
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener mis ventas" });
  }
};

exports.actualizarEstadoCompra = async (req, res) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body;

  try {
    const compra = await prisma.compra.update({
      where: { id: parseInt(id) },
      data: { estado: nuevoEstado },
    });

    res.json(compra);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al actualizar el estado de la compra" });
  }
};
