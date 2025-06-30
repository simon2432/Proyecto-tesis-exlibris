const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.crearPublicacion = async (req, res) => {
  const {
    titulo,
    autor,
    genero,
    editorial,
    paginas,
    idioma,
    estadoLibro,
    precio,
    imagenUrl,
  } = req.body;
  const vendedorId = req.userId;

  try {
    const nueva = await prisma.publicacion.create({
      data: {
        titulo,
        autor,
        genero,
        editorial,
        paginas,
        idioma,
        estadoLibro,
        precio: parseFloat(precio),
        imagenUrl,
        vendedorId,
      },
    });
    res.status(201).json(nueva);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la publicación" });
  }
};

exports.obtenerPublicaciones = async (req, res) => {
  try {
    const publicaciones = await prisma.publicacion.findMany({
      where: { estado: "activa" },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            ubicacion: true,
            puntuacionVendedor: true,
          },
        },
      },
      orderBy: { fechaPublicacion: "desc" },
    });
    res.json(publicaciones);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener publicaciones" });
  }
};

exports.obtenerUnaPublicacion = async (req, res) => {
  const { id } = req.params;

  try {
    const publicacion = await prisma.publicacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            ubicacion: true,
            puntuacionVendedor: true,
          },
        },
      },
    });

    if (!publicacion) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    res.json(publicacion);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la publicación" });
  }
};

exports.obtenerMisPublicaciones = async (req, res) => {
  try {
    const publicaciones = await prisma.publicacion.findMany({
      where: { vendedorId: req.userId },
      orderBy: { fechaPublicacion: "desc" },
    });
    res.json(publicaciones);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener mis publicaciones" });
  }
};
