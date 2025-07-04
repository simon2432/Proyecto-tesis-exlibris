const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

// Cache simple para portadas de libros
const portadasCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// Función para obtener portada con caché
const getPortadaConCache = async (libroId) => {
  const cached = portadasCache.get(libroId);
  if (
    cached &&
    cached.portada !== "https://placehold.co/90x120" &&
    Date.now() - cached.timestamp < CACHE_DURATION
  ) {
    console.log(`[Portada] libroId: ${libroId} => (cache) ${cached.portada}`);
    return cached.portada;
  }

  try {
    const libroRes = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${libroId}?key=${GOOGLE_BOOKS_API_KEY}`,
      { timeout: 5000 }
    );
    const imageUrl =
      libroRes.data.volumeInfo?.imageLinks?.thumbnail ||
      libroRes.data.volumeInfo?.imageLinks?.smallThumbnail ||
      "https://placehold.co/90x120";

    if (imageUrl !== "https://placehold.co/90x120") {
      portadasCache.set(libroId, {
        portada: imageUrl,
        timestamp: Date.now(),
      });
    }
    console.log(`[Portada] libroId: ${libroId} => (api) ${imageUrl}`);
    return imageUrl;
  } catch {
    console.log(
      `[Portada] libroId: ${libroId} => (error) https://placehold.co/90x120`
    );
    return "https://placehold.co/90x120";
  }
};

const getPortadaGoogleBooks = async (libroId) => {
  try {
    const libroRes = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${libroId}?key=${GOOGLE_BOOKS_API_KEY}`,
      { timeout: 5000 }
    );
    return (
      libroRes.data.volumeInfo?.imageLinks?.thumbnail ||
      libroRes.data.volumeInfo?.imageLinks?.smallThumbnail ||
      "https://placehold.co/90x120"
    );
  } catch {
    return "https://placehold.co/90x120";
  }
};

// Obtener lecturas del usuario autenticado con portadas
exports.getMisLecturas = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "No autenticado" });

    const lecturas = await prisma.lectura.findMany({
      where: { userId: req.userId },
      orderBy: { fechaInicio: "desc" },
      take: 20, // Limitar a 20 lecturas para mejor rendimiento
    });

    res.json(lecturas); // Ya tienen la portada guardada
  } catch (err) {
    console.error("Error en getMisLecturas:", err);
    res.status(500).json({ error: "Error al obtener lecturas" });
  }
};

// Crear una nueva lectura
exports.crearLectura = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "No autenticado" });
    const { libroId, fechaInicio, fechaFin } = req.body;
    if (!libroId) return res.status(400).json({ error: "Falta libroId" });

    // Buscar portada al crear la lectura
    const portada = await getPortadaGoogleBooks(libroId);

    const lectura = await prisma.lectura.create({
      data: {
        userId: req.userId,
        libroId,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        portada, // Guardar la portada
      },
    });
    res.json(lectura);
  } catch (err) {
    res.status(500).json({ error: "Error al crear lectura" });
  }
};

// Obtener detalle de una lectura
exports.getLectura = async (req, res) => {
  try {
    const { id } = req.params;
    const lectura = await prisma.lectura.findUnique({
      where: { id: Number(id) },
    });
    if (!lectura) return res.status(404).json({ error: "No encontrada" });
    res.json(lectura);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener lectura" });
  }
};

// Actualizar fechas o reseña de una lectura
exports.actualizarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin, resenaTexto, valoracion } = req.body;
    const lectura = await prisma.lectura.update({
      where: { id: Number(id) },
      data: {
        ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
        ...(fechaFin && { fechaFin: new Date(fechaFin) }),
        ...(resenaTexto !== undefined && { resenaTexto }),
        ...(valoracion !== undefined && { valoracion }),
      },
    });
    res.json(lectura);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar lectura" });
  }
};

// Eliminar una lectura
exports.eliminarLectura = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lectura.delete({ where: { id: Number(id) } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar lectura" });
  }
};

exports.limpiarCachePortada = (req, res) => {
  const { libroId } = req.params;
  portadasCache.delete(libroId);
  res.json({ ok: true });
};
