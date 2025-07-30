const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

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

// Obtener favoritos del usuario autenticado
exports.getFavoritos = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "No autenticado" });
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    res.json({ librosFavoritos: user?.librosFavoritos ?? [] });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener favoritos" });
  }
};

// Actualizar favoritos del usuario autenticado
exports.updateFavoritos = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "No autenticado" });
    const { librosFavoritos } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { librosFavoritos },
    });
    res.json({ librosFavoritos: user.librosFavoritos });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar favoritos" });
  }
};

// PUT /api/usuarios/editar
exports.editarPerfil = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: "No autenticado" });
    const {
      nombre,
      email,
      telefono,
      fotoPerfil,
      passwordActual,
      passwordNueva,
    } = req.body;
    const data = {};
    if (nombre) data.nombre = nombre;
    if (email) data.email = email;
    if (telefono) data.telefono = telefono;
    if (fotoPerfil) data.fotoPerfil = fotoPerfil;
    // Si se quiere cambiar la contraseña
    if (passwordActual && passwordNueva) {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user)
        return res.status(404).json({ error: "Usuario no encontrado" });
      const valid = await bcrypt.compare(passwordActual, user.password);
      if (!valid)
        return res.status(400).json({ error: "Contraseña actual incorrecta" });
      data.password = await bcrypt.hash(passwordNueva, 10);
    }
    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
    });
    // No enviar password al frontend
    const { password, ...userData } = user;
    res.json({ user: userData });
  } catch (err) {
    res.status(500).json({ error: "Error al editar perfil" });
  }
};

// GET /api/usuarios/:id
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        ubicacion: true,
        puntuacionVendedor: true,
        librosVendidos: true,
        librosComprados: true,
        fotoPerfil: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log("[User] Datos del usuario obtenidos:", {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      ubicacion: user.ubicacion,
    });

    res.json(user);
  } catch (error) {
    console.error("Error obteniendo usuario por ID:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
