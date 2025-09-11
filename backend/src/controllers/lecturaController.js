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
    cached.portada !==
      "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen" &&
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
    let imageUrl =
      libroRes.data.volumeInfo?.imageLinks?.thumbnail ||
      libroRes.data.volumeInfo?.imageLinks?.smallThumbnail ||
      "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen";

    // Mejorar la calidad de la imagen de Google Books
    if (
      imageUrl &&
      imageUrl !== "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen"
    ) {
      if (imageUrl.includes("zoom=1")) {
        imageUrl = imageUrl.replace("zoom=1", "zoom=2");
      } else if (!imageUrl.includes("zoom=")) {
        const separator = imageUrl.includes("?") ? "&" : "?";
        imageUrl = `${imageUrl}${separator}zoom=2`;
      }

      // Asegurar que la URL sea HTTPS
      if (imageUrl.startsWith("http://")) {
        imageUrl = imageUrl.replace("http://", "https://");
      }
    }

    if (
      imageUrl !== "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen"
    ) {
      portadasCache.set(libroId, {
        portada: imageUrl,
        timestamp: Date.now(),
      });
    }
    console.log(`[Portada] libroId: ${libroId} => (api) ${imageUrl}`);
    return imageUrl;
  } catch {
    console.log(
      `[Portada] libroId: ${libroId} => (error) https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen`
    );
    return "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen";
  }
};

const getPortadaGoogleBooks = async (libroId) => {
  try {
    const libroRes = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${libroId}?key=${GOOGLE_BOOKS_API_KEY}`,
      { timeout: 5000 }
    );

    let imageUrl =
      libroRes.data.volumeInfo?.imageLinks?.thumbnail ||
      libroRes.data.volumeInfo?.imageLinks?.smallThumbnail ||
      "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen";

    // Mejorar la calidad de la imagen de Google Books
    if (
      imageUrl &&
      imageUrl !== "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen"
    ) {
      if (imageUrl.includes("zoom=1")) {
        imageUrl = imageUrl.replace("zoom=1", "zoom=2");
      } else if (!imageUrl.includes("zoom=")) {
        const separator = imageUrl.includes("?") ? "&" : "?";
        imageUrl = `${imageUrl}${separator}zoom=2`;
      }

      // Asegurar que la URL sea HTTPS
      if (imageUrl.startsWith("http://")) {
        imageUrl = imageUrl.replace("http://", "https://");
      }
    }

    return imageUrl;
  } catch {
    return "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen";
  }
};

const getLibroInfoGoogleBooks = async (libroId) => {
  try {
    const libroRes = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${libroId}?key=${GOOGLE_BOOKS_API_KEY}`,
      { timeout: 5000 }
    );

    const titulo = libroRes.data.volumeInfo?.title || "Título no disponible";

    let imageUrl =
      libroRes.data.volumeInfo?.imageLinks?.thumbnail ||
      libroRes.data.volumeInfo?.imageLinks?.smallThumbnail ||
      "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen";

    // Mejorar la calidad de la imagen de Google Books
    if (
      imageUrl &&
      imageUrl !== "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen"
    ) {
      if (imageUrl.includes("zoom=1")) {
        imageUrl = imageUrl.replace("zoom=1", "zoom=2");
      } else if (!imageUrl.includes("zoom=")) {
        const separator = imageUrl.includes("?") ? "&" : "?";
        imageUrl = `${imageUrl}${separator}zoom=2`;
      }

      // Asegurar que la URL sea HTTPS
      if (imageUrl.startsWith("http://")) {
        imageUrl = imageUrl.replace("http://", "https://");
      }
    }

    return { titulo, portada: imageUrl };
  } catch {
    return {
      titulo: "Título no disponible",
      portada: "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen",
    };
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

    // Buscar información del libro (título y portada) al crear la lectura
    const { titulo, portada } = await getLibroInfoGoogleBooks(libroId);

    const lectura = await prisma.lectura.create({
      data: {
        userId: req.userId,
        libroId,
        titulo, // Guardar el título del libro
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
    const { fechaInicio, fechaFin, reviewComment, reviewRating } = req.body;

    // Obtener la lectura actual para verificar si se está completando
    const lecturaActual = await prisma.lectura.findUnique({
      where: { id: Number(id) },
      select: { userId: true, fechaFin: true },
    });

    if (!lecturaActual) {
      return res.status(404).json({ error: "Lectura no encontrada" });
    }

    const seEstaCompletando = !lecturaActual.fechaFin && fechaFin;

    const lectura = await prisma.lectura.update({
      where: { id: Number(id) },
      data: {
        ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
        ...(fechaFin && { fechaFin: new Date(fechaFin) }),
        ...(reviewComment !== undefined && { reviewComment }),
        ...(reviewRating !== undefined && { reviewRating }),
      },
    });

    // Si se está completando la lectura, verificar logros
    if (seEstaCompletando) {
      try {
        const { verificarLogros } = require("./userController");
        const logrosInfo = await verificarLogros(lecturaActual.userId);
        if (logrosInfo && logrosInfo.nuevosLogros.length > 0) {
          // Agregar información de logros a la respuesta
          lectura.logrosNuevos = logrosInfo.nuevosLogros;
        }
      } catch (logrosError) {
        console.error("Error verificando logros:", logrosError);
        // No fallar la operación principal por errores en logros
      }
    }

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

// Función auxiliar para detectar spoilers en reseñas usando OpenAI
const detectarSpoilerEnResena = async (reviewComment, bookInfo) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en literatura. Dada la siguiente reseña y la información del libro, responde solo con 'spoiler' o 'no spoiler' según si la reseña revela detalles importantes de la trama. No expliques tu respuesta.",
          },
          {
            role: "user",
            content: `Libro: ${bookInfo}\nReseña: ${reviewComment}`,
          },
        ],
        max_tokens: 10,
        temperature: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    const respuesta = response.data.choices[0].message.content
      .trim()
      .toLowerCase();
    return respuesta.includes("spoiler") && !respuesta.includes("no spoiler");
  } catch (error) {
    console.error("Error detectando spoiler en reseña:", error);
    return null; // No se pudo determinar
  }
};

// Agregar o modificar reseña de una lectura
exports.agregarOModificarResena = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewRating, reviewComment } = req.body;
    if (!req.userId) return res.status(401).json({ error: "No autenticado" });
    if (!reviewRating || reviewRating < 1 || reviewRating > 5)
      return res.status(400).json({ error: "Valoración inválida" });
    if (!reviewComment || reviewComment.length > 300)
      return res.status(400).json({ error: "Comentario inválido o muy largo" });

    const lectura = await prisma.lectura.findUnique({
      where: { id: Number(id) },
    });
    if (!lectura)
      return res.status(404).json({ error: "Lectura no encontrada" });
    if (lectura.userId !== req.userId)
      return res.status(403).json({ error: "No autorizado" });
    if (!lectura.fechaFin)
      return res
        .status(400)
        .json({ error: "Solo puedes reseñar lecturas finalizadas" });

    // Guardar la reseña primero
    let updated = await prisma.lectura.update({
      where: { id: Number(id) },
      data: { reviewRating, reviewComment },
    });

    // Preparar info del libro para el prompt
    const bookInfo = `Título: ${updated.libroId}`; // Puedes enriquecer con más datos si los tienes
    // Detectar spoiler
    const esSpoiler = await detectarSpoilerEnResena(reviewComment, bookInfo);
    // Actualizar el campo esSpoiler si se pudo determinar
    if (esSpoiler !== null) {
      updated = await prisma.lectura.update({
        where: { id: Number(id) },
        data: { esSpoiler },
      });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error al guardar reseña" });
  }
};

// Eliminar reseña de una lectura
exports.eliminarResena = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.userId) return res.status(401).json({ error: "No autenticado" });
    const lectura = await prisma.lectura.findUnique({
      where: { id: Number(id) },
    });
    if (!lectura)
      return res.status(404).json({ error: "Lectura no encontrada" });
    if (lectura.userId !== req.userId)
      return res.status(403).json({ error: "No autorizado" });
    const updated = await prisma.lectura.update({
      where: { id: Number(id) },
      data: { reviewRating: null, reviewComment: null },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar reseña" });
  }
};

// Obtener todas las reseñas de un libro (por libroId), incluyendo datos del usuario
exports.getResenasPorLibro = async (req, res) => {
  try {
    const { libroId } = req.params;
    console.log("[Reseñas] libroId recibido:", libroId);
    if (!libroId) return res.status(400).json({ error: "Falta libroId" });
    const lecturas = await prisma.lectura.findMany({
      where: {
        libroId: String(libroId),
        reviewRating: { not: null },
        reviewComment: { not: null },
      },
      orderBy: { fechaFin: "desc" },
      include: {
        user: {
          select: {
            nombre: true,
            fotoPerfil: true,
            id: true,
          },
        },
      },
    });
    console.log("[Reseñas] lecturas encontradas:", lecturas.length);
    // Mapear a formato de reseña
    const resenas = lecturas.map((l) => ({
      id: l.id,
      userId: l.user.id,
      nombre: l.user.nombre,
      fotoPerfil: l.user.fotoPerfil,
      reviewRating: l.reviewRating,
      reviewComment: l.reviewComment,
      esSpoiler: l.esSpoiler,
      fecha: l.fechaFin,
    }));
    res.json({ resenas });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
};
