const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

// Obtener lecturas del usuario autenticado con portadas
exports.getMisLecturas = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "No autenticado" });
    const lecturas = await prisma.lectura.findMany({
      where: { userId: req.userId },
      orderBy: { fechaInicio: "desc" },
    });

    // Obtener portadas de Google Books en paralelo
    const lecturasConPortadas = await Promise.all(
      lecturas.map(async (lectura) => {
        if (lectura.libroId) {
          try {
            const libroRes = await axios.get(
              `https://www.googleapis.com/books/v1/volumes/${lectura.libroId}`,
              { timeout: 3000 }
            );
            const imageUrl =
              libroRes.data.volumeInfo?.imageLinks?.thumbnail ||
              libroRes.data.volumeInfo?.imageLinks?.smallThumbnail ||
              "https://placehold.co/90x120";
            return { ...lectura, portada: imageUrl };
          } catch {
            return { ...lectura, portada: "https://placehold.co/90x120" };
          }
        } else {
          return { ...lectura, portada: "https://placehold.co/90x120" };
        }
      })
    );

    res.json(lecturasConPortadas);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener lecturas" });
  }
};

// Crear una nueva lectura
exports.crearLectura = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "No autenticado" });
    const { libroId, fechaInicio, fechaFin } = req.body;
    if (!libroId) return res.status(400).json({ error: "Falta libroId" });
    const lectura = await prisma.lectura.create({
      data: {
        userId: req.userId,
        libroId,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
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
