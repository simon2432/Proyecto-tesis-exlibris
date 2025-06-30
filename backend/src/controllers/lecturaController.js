const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.agregarLectura = async (req, res) => {
  const userId = req.userId;
  const { libroId, fechaInicio } = req.body;

  try {
    const nuevaLectura = await prisma.lectura.create({
      data: {
        userId,
        libroId,
        fechaInicio: new Date(fechaInicio),
      },
    });
    res.status(201).json(nuevaLectura);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar la lectura" });
  }
};

exports.obtenerLecturas = async (req, res) => {
  try {
    const lecturas = await prisma.lectura.findMany({
      where: { userId: req.userId },
      orderBy: { fechaInicio: "desc" },
    });
    res.json(lecturas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el historial lector" });
  }
};

exports.actualizarLectura = async (req, res) => {
  const { id } = req.params;
  const { fechaFin, resenaTexto, valoracion } = req.body;

  try {
    const lectura = await prisma.lectura.update({
      where: { id: parseInt(id) },
      data: {
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        resenaTexto,
        valoracion,
      },
    });
    res.json(lectura);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la lectura" });
  }
};

exports.eliminarLectura = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.lectura.delete({
      where: { id: parseInt(id) },
    });
    res.json({ mensaje: "Lectura eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la lectura" });
  }
};
