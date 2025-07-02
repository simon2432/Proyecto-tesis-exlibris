const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/usuario/foto-perfil
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió ninguna imagen." });
    }

    if (!req.userId) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    const userId = req.userId;
    const fileName = req.file.filename;
    const fotoPerfilUrl = `/assets/fotosPerfil/${fileName}`;

    // Actualizar el usuario en la base de datos
    const user = await prisma.user.update({
      where: { id: userId },
      data: { fotoPerfil: fotoPerfilUrl },
    });

    res.json({ url: fotoPerfilUrl, user });
  } catch (error) {
    res.status(500).json({ error: "Error al subir la foto de perfil." });
  }
};
