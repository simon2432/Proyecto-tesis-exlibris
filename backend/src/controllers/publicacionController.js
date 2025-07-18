const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");

// Configuración de multer para publicaciones
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../assets/publicaciones/"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

exports.uploadPublicacionImage = upload.single("imagen");

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
  } = req.body;
  const vendedorId = req.userId;

  console.log("Datos recibidos para crear publicación:", {
    titulo,
    autor,
    genero,
    editorial,
    paginas,
    idioma,
    estadoLibro,
    precio,
    vendedorId,
  });

  let imagenUrl = null;
  if (req.file) {
    imagenUrl = `/assets/publicaciones/${req.file.filename}`;
  }

  try {
    // Validar que los campos numéricos sean válidos
    const paginasNum = parseInt(paginas);
    const precioNum = parseFloat(precio);

    if (isNaN(paginasNum) || paginasNum <= 0) {
      return res
        .status(400)
        .json({
          error: "El número de páginas debe ser un número válido mayor a 0",
        });
    }

    if (isNaN(precioNum) || precioNum <= 0) {
      return res
        .status(400)
        .json({ error: "El precio debe ser un número válido mayor a 0" });
    }

    const nueva = await prisma.publicacion.create({
      data: {
        titulo,
        autor,
        genero,
        editorial,
        paginas: paginasNum,
        idioma,
        estadoLibro,
        precio: precioNum,
        imagenUrl,
        vendedorId,
        estado: "activa",
      },
    });
    console.log("Publicación creada exitosamente:", nueva);
    res.status(201).json(nueva);
  } catch (error) {
    console.error("Error al crear publicación:", error);
    res.status(500).json({ error: "Error al crear la publicación" });
  }
};

exports.obtenerPublicaciones = async (req, res) => {
  try {
    const publicaciones = await prisma.publicacion.findMany({
      where: {
        estado: "activa",
        vendedorId: { not: req.userId }, // Excluir publicaciones del usuario actual
      },
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
    console.log("Buscando publicación con ID:", id);
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
      console.log("Publicación no encontrada");
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    console.log("Publicación encontrada:", publicacion);
    res.json(publicacion);
  } catch (error) {
    console.error("Error al obtener publicación:", error);
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

exports.editarPublicacion = async (req, res) => {
  const { id } = req.params;
  const {
    titulo,
    autor,
    genero,
    editorial,
    paginas,
    idioma,
    estadoLibro,
    precio,
  } = req.body;

  let imagenUrl = undefined;
  if (req.file) {
    imagenUrl = `/assets/publicaciones/${req.file.filename}`;
  }

  try {
    const data = {
      titulo,
      autor,
      genero,
      editorial,
      paginas: paginas ? parseInt(paginas) : undefined,
      idioma,
      estadoLibro,
      precio: precio ? parseFloat(precio) : undefined,
    };
    if (imagenUrl) data.imagenUrl = imagenUrl;
    const updated = await prisma.publicacion.update({
      where: { id: parseInt(id) },
      data,
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al editar la publicación" });
  }
};

exports.eliminarPublicacion = async (req, res) => {
  console.log("=== ELIMINAR PUBLICACIÓN INICIADO ===");
  console.log("Método HTTP:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", req.headers);

  const { id } = req.params;
  const vendedorId = req.userId;

  console.log("Eliminar publicación - ID:", id, "VendedorID:", vendedorId);

  try {
    // Verificar que la publicación pertenece al usuario
    const publicacion = await prisma.publicacion.findUnique({
      where: { id: parseInt(id) },
    });

    console.log("Publicación encontrada:", publicacion);

    if (!publicacion) {
      console.log("Publicación no encontrada");
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    if (publicacion.vendedorId !== vendedorId) {
      console.log("No tiene permisos para eliminar esta publicación");
      return res
        .status(403)
        .json({ error: "No tienes permisos para eliminar esta publicación" });
    }

    // Eliminar la publicación
    console.log("Eliminando publicación...");
    await prisma.publicacion.delete({
      where: { id: parseInt(id) },
    });

    console.log("Publicación eliminada exitosamente");
    res.json({ message: "Publicación eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar publicación:", error);
    res.status(500).json({ error: "Error al eliminar la publicación" });
  }
};
