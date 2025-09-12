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
      ubicacion,
      fotoPerfil,
      passwordActual,
      passwordNueva,
    } = req.body;
    const data = {};
    if (nombre) data.nombre = nombre;
    if (email) data.email = email;
    if (telefono) data.telefono = telefono;
    if (ubicacion) data.ubicacion = ubicacion;
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
        fotoPerfil: true,
        puntuacionVendedor: true,
        cantidadValoraciones: true,
        sumaValoraciones: true,
        librosFavoritos: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// GET /api/usuarios/estadisticas
exports.getEstadisticasUsuario = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userId = req.userId;

    // Contar libros vendidos (compras completadas donde el usuario es vendedor)
    const librosVendidos = await prisma.compra.count({
      where: {
        publicacion: {
          vendedorId: userId,
        },
        estado: "completado",
      },
    });

    // Contar libros comprados (compras completadas donde el usuario es comprador)
    const librosComprados = await prisma.compra.count({
      where: {
        compradorId: userId,
        estado: "completado",
      },
    });

    // Obtener puntuación promedio del vendedor
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        puntuacionVendedor: true,
        cantidadValoraciones: true,
        sumaValoraciones: true,
      },
    });

    res.json({
      librosVendidos,
      librosComprados,
      puntuacionVendedor: usuario?.puntuacionVendedor || 0,
      cantidadValoraciones: usuario?.cantidadValoraciones || 0,
      sumaValoraciones: usuario?.sumaValoraciones || 0,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// GET /api/usuarios/logros
exports.getLogrosUsuario = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userId = req.userId;

    // Contar libros leídos (lecturas con fechaFin)
    const librosLeidos = await prisma.lectura.count({
      where: {
        userId: userId,
        fechaFin: { not: null }, // Solo libros que han sido terminados
      },
    });

    // Contar libros vendidos (compras con estado completado)
    const librosVendidos = await prisma.compra.count({
      where: {
        vendedorId: userId,
        estado: "completado",
      },
    });

    // Contar libros comprados (compras con estado completado)
    const librosComprados = await prisma.compra.count({
      where: {
        compradorId: userId,
        estado: "completado",
      },
    });

    // Obtener logros actuales del usuario
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { logros: true, puntuacionVendedor: true },
    });

    const logrosActuales = usuario?.logros || [];
    const nuevosLogros = [];

    // Verificar qué logros debería tener basado en la cantidad de libros leídos
    if (librosLeidos >= 1 && !logrosActuales.includes("Leidos1")) {
      nuevosLogros.push("Leidos1");
    }
    if (librosLeidos >= 5 && !logrosActuales.includes("Leidos5")) {
      nuevosLogros.push("Leidos5");
    }
    if (librosLeidos >= 10 && !logrosActuales.includes("Leidos10")) {
      nuevosLogros.push("Leidos10");
    }
    if (librosLeidos >= 20 && !logrosActuales.includes("Leidos20")) {
      nuevosLogros.push("Leidos20");
    }
    if (librosLeidos >= 25 && !logrosActuales.includes("Leidos25")) {
      nuevosLogros.push("Leidos25");
    }

    // Verificar qué logros debería tener basado en la cantidad de libros vendidos
    if (librosVendidos >= 1 && !logrosActuales.includes("Vendido1")) {
      nuevosLogros.push("Vendido1");
    }
    if (librosVendidos >= 5 && !logrosActuales.includes("Vendido5")) {
      nuevosLogros.push("Vendido5");
    }
    if (librosVendidos >= 10 && !logrosActuales.includes("Vendido10")) {
      nuevosLogros.push("Vendido10");
    }
    if (librosVendidos >= 20 && !logrosActuales.includes("Vendido20")) {
      nuevosLogros.push("Vendido20");
    }
    if (librosVendidos >= 40 && !logrosActuales.includes("Vendido40")) {
      nuevosLogros.push("Vendido40");
    }

    // Verificar qué logros debería tener basado en la cantidad de libros comprados
    if (librosComprados >= 1 && !logrosActuales.includes("Comprado1")) {
      nuevosLogros.push("Comprado1");
    }
    if (librosComprados >= 5 && !logrosActuales.includes("Comprado5")) {
      nuevosLogros.push("Comprado5");
    }
    if (librosComprados >= 10 && !logrosActuales.includes("Comprado10")) {
      nuevosLogros.push("Comprado10");
    }
    if (librosComprados >= 20 && !logrosActuales.includes("Comprado20")) {
      nuevosLogros.push("Comprado20");
    }
    if (librosComprados >= 30 && !logrosActuales.includes("Comprado30")) {
      nuevosLogros.push("Comprado30");
    }

    // Verificar qué logros debería tener basado en la puntuación del vendedor
    const puntuacionVendedor = usuario?.puntuacionVendedor || 0;
    if (
      puntuacionVendedor >= 4.0 &&
      !logrosActuales.includes("Puntuacion4.0")
    ) {
      nuevosLogros.push("Puntuacion4.0");
    }
    if (
      puntuacionVendedor >= 5.0 &&
      !logrosActuales.includes("Puntuacion5.0")
    ) {
      nuevosLogros.push("Puntuacion5.0");
    }

    // Si hay nuevos logros, actualizar al usuario
    if (nuevosLogros.length > 0) {
      const todosLosLogros = [...logrosActuales, ...nuevosLogros];
      await prisma.user.update({
        where: { id: userId },
        data: { logros: todosLosLogros },
      });
    }

    // Obtener logros actualizados
    const logrosFinales = [...logrosActuales, ...nuevosLogros];

    res.json({
      librosLeidos,
      librosVendidos,
      librosComprados,
      puntuacionVendedor: usuario?.puntuacionVendedor || 0,
      logros: logrosFinales,
      nuevosLogros,
    });
  } catch (error) {
    console.error("Error al obtener logros:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Función para verificar y otorgar logros (se puede llamar desde otros controladores)
exports.verificarLogros = async (userId) => {
  try {
    // Contar libros leídos
    const librosLeidos = await prisma.lectura.count({
      where: {
        userId: userId,
        fechaFin: { not: null },
      },
    });

    // Contar libros vendidos (compras con estado completado)
    const librosVendidos = await prisma.compra.count({
      where: {
        vendedorId: userId,
        estado: "completado",
      },
    });

    // Contar libros comprados (compras con estado completado)
    const librosComprados = await prisma.compra.count({
      where: {
        compradorId: userId,
        estado: "completado",
      },
    });

    // Obtener logros actuales
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { logros: true },
    });

    const logrosActuales = usuario?.logros || [];
    const nuevosLogros = [];

    // Verificar logros de lectura
    if (librosLeidos >= 1 && !logrosActuales.includes("Leidos1")) {
      nuevosLogros.push("Leidos1");
    }
    if (librosLeidos >= 5 && !logrosActuales.includes("Leidos5")) {
      nuevosLogros.push("Leidos5");
    }
    if (librosLeidos >= 10 && !logrosActuales.includes("Leidos10")) {
      nuevosLogros.push("Leidos10");
    }
    if (librosLeidos >= 20 && !logrosActuales.includes("Leidos20")) {
      nuevosLogros.push("Leidos20");
    }
    if (librosLeidos >= 25 && !logrosActuales.includes("Leidos25")) {
      nuevosLogros.push("Leidos25");
    }

    // Verificar logros de venta
    if (librosVendidos >= 1 && !logrosActuales.includes("Vendido1")) {
      nuevosLogros.push("Vendido1");
    }
    if (librosVendidos >= 5 && !logrosActuales.includes("Vendido5")) {
      nuevosLogros.push("Vendido5");
    }
    if (librosVendidos >= 10 && !logrosActuales.includes("Vendido10")) {
      nuevosLogros.push("Vendido10");
    }
    if (librosVendidos >= 20 && !logrosActuales.includes("Vendido20")) {
      nuevosLogros.push("Vendido20");
    }
    if (librosVendidos >= 40 && !logrosActuales.includes("Vendido40")) {
      nuevosLogros.push("Vendido40");
    }

    // Verificar logros de compra
    if (librosComprados >= 1 && !logrosActuales.includes("Comprado1")) {
      nuevosLogros.push("Comprado1");
    }
    if (librosComprados >= 5 && !logrosActuales.includes("Comprado5")) {
      nuevosLogros.push("Comprado5");
    }
    if (librosComprados >= 10 && !logrosActuales.includes("Comprado10")) {
      nuevosLogros.push("Comprado10");
    }
    if (librosComprados >= 20 && !logrosActuales.includes("Comprado20")) {
      nuevosLogros.push("Comprado20");
    }
    if (librosComprados >= 30 && !logrosActuales.includes("Comprado30")) {
      nuevosLogros.push("Comprado30");
    }

    // Verificar logros de puntuación del vendedor
    const usuarioActual = await prisma.user.findUnique({
      where: { id: userId },
      select: { puntuacionVendedor: true },
    });

    const puntuacionVendedor = usuarioActual?.puntuacionVendedor || 0;
    if (
      puntuacionVendedor >= 4.0 &&
      !logrosActuales.includes("Puntuacion4.0")
    ) {
      nuevosLogros.push("Puntuacion4.0");
    }
    if (
      puntuacionVendedor >= 5.0 &&
      !logrosActuales.includes("Puntuacion5.0")
    ) {
      nuevosLogros.push("Puntuacion5.0");
    }

    // Si hay nuevos logros, actualizar al usuario
    if (nuevosLogros.length > 0) {
      const todosLosLogros = [...logrosActuales, ...nuevosLogros];
      await prisma.user.update({
        where: { id: userId },
        data: { logros: todosLosLogros },
      });
    }

    return {
      librosLeidos,
      librosVendidos,
      librosComprados,
      logros: [...logrosActuales, ...nuevosLogros],
      nuevosLogros,
    };
  } catch (error) {
    console.error("Error al verificar logros:", error);
    return null;
  }
};
