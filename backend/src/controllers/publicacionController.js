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

  let imagenUrl = null;
  if (req.file) {
    imagenUrl = `/assets/publicaciones/${req.file.filename}`;
  }

  try {
    const nueva = await prisma.publicacion.create({
      data: {
        titulo,
        autor,
        genero,
        editorial,
        paginas: parseInt(paginas),
        idioma,
        estadoLibro,
        precio: parseFloat(precio),
        imagenUrl,
        vendedorId,
        estado: "activa",
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
