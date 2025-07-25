const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Crear una nueva compra
exports.crearCompra = async (req, res) => {
  try {
    const { publicacionId, vendedorId, tipoEntrega, precio } = req.body;
    const compradorId = req.userId; // Viene del middleware de autenticación

    console.log("[Compra] Creando compra:", {
      compradorId,
      publicacionId,
      vendedorId,
      tipoEntrega,
      precio,
    });

    // Validar que la publicación existe y está activa
    const publicacion = await prisma.publicacion.findFirst({
      where: {
        id: parseInt(publicacionId),
        estado: "activa",
      },
    });

    if (!publicacion) {
      return res
        .status(404)
        .json({ error: "Publicación no encontrada o no disponible" });
    }

    // Validar que el comprador no sea el mismo vendedor
    if (compradorId === parseInt(vendedorId)) {
      return res
        .status(400)
        .json({ error: "No puedes comprar tu propia publicación" });
    }

    // Determinar el estado inicial según el tipo de entrega
    let estadoInicial;
    if (tipoEntrega === "encuentro") {
      estadoInicial = "encuentro";
    } else if (tipoEntrega === "envio") {
      estadoInicial = "pago_pendiente";
    } else {
      return res.status(400).json({ error: "Tipo de entrega inválido" });
    }

    // Crear la compra
    const compra = await prisma.compra.create({
      data: {
        compradorId: parseInt(compradorId),
        publicacionId: parseInt(publicacionId),
        vendedorId: parseInt(vendedorId),
        tipoEntrega: tipoEntrega,
        estado: estadoInicial,
        precio: parseFloat(precio),
      },
      include: {
        publicacion: {
          include: {
            vendedor: {
              select: {
                id: true,
                nombre: true,
                ubicacion: true,
              },
            },
          },
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            ubicacion: true,
          },
        },
      },
    });

    console.log("[Compra] Compra creada exitosamente:", compra.id);

    // Actualizar el estado de la publicación a "en_venta" (opcional, para evitar compras múltiples)
    await prisma.publicacion.update({
      where: { id: parseInt(publicacionId) },
      data: { estado: "en_venta" },
    });

    res.status(201).json({
      message: "Compra creada exitosamente",
      compra: {
        id: compra.id,
        estado: compra.estado,
        tipoEntrega: compra.tipoEntrega,
        precio: compra.precio,
        fechaCompra: compra.fechaCompra,
        publicacion: {
          id: compra.publicacion.id,
          titulo: compra.publicacion.titulo,
          autor: compra.publicacion.autor,
          imagenUrl: compra.publicacion.imagenUrl,
        },
        vendedor: {
          id: compra.vendedor.id,
          nombre: compra.vendedor.nombre,
          ubicacion: compra.vendedor.ubicacion,
        },
      },
    });
  } catch (error) {
    console.error("[Compra] Error creando compra:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener compras del usuario (como comprador)
exports.obtenerCompras = async (req, res) => {
  try {
    const compradorId = req.userId;
    const { estado } = req.query; // Opcional: filtrar por estado

    console.log("[Compra] Obteniendo compras para usuario:", compradorId);

    const whereClause = {
      compradorId: parseInt(compradorId),
    };

    // Si se especifica un estado, agregarlo al filtro
    if (estado) {
      whereClause.estado = estado;
    }

    const compras = await prisma.compra.findMany({
      where: whereClause,
      include: {
        publicacion: {
          include: {
            vendedor: {
              select: {
                id: true,
                nombre: true,
                ubicacion: true,
              },
            },
          },
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            ubicacion: true,
          },
        },
      },
      orderBy: {
        fechaCompra: "desc",
      },
    });

    console.log(`[Compra] Encontradas ${compras.length} compras`);

    // Formatear las compras para el frontend
    const comprasFormateadas = compras.map((compra) => ({
      id: compra.id,
      portada: compra.publicacion.imagenUrl,
      titulo: compra.publicacion.titulo,
      vendedor: compra.vendedor.nombre,
      fecha: compra.fechaCompra.toLocaleDateString("es-ES"),
      tipoEntrega: compra.tipoEntrega === "envio" ? "Envío" : "Encuentro",
      estado: compra.estado,
      precio: compra.precio,
    }));

    res.json(comprasFormateadas);
  } catch (error) {
    console.error("[Compra] Error obteniendo compras:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener ventas del usuario (como vendedor)
exports.obtenerVentas = async (req, res) => {
  try {
    const vendedorId = req.userId;
    const { estado } = req.query; // Opcional: filtrar por estado

    console.log("[Compra] Obteniendo ventas para usuario:", vendedorId);

    const whereClause = {
      vendedorId: parseInt(vendedorId),
    };

    // Si se especifica un estado, agregarlo al filtro
    if (estado) {
      whereClause.estado = estado;
    }

    const ventas = await prisma.compra.findMany({
      where: whereClause,
      include: {
        publicacion: {
          include: {
            vendedor: {
              select: {
                id: true,
                nombre: true,
                ubicacion: true,
              },
            },
          },
        },
        comprador: {
          select: {
            id: true,
            nombre: true,
            ubicacion: true,
          },
        },
      },
      orderBy: {
        fechaCompra: "desc",
      },
    });

    console.log(`[Compra] Encontradas ${ventas.length} ventas`);

    // Formatear las ventas para el frontend
    const ventasFormateadas = ventas.map((venta) => ({
      id: venta.id,
      portada: venta.publicacion.imagenUrl,
      titulo: venta.publicacion.titulo,
      comprador: venta.comprador.nombre,
      fecha: venta.fechaCompra.toLocaleDateString("es-ES"),
      tipoEntrega: venta.tipoEntrega === "envio" ? "Envío" : "Encuentro",
      estado: venta.estado,
      precio: venta.precio,
    }));

    res.json(ventasFormateadas);
  } catch (error) {
    console.error("[Compra] Error obteniendo ventas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Obtener una compra específica
exports.obtenerUnaCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log("[Compra] Obteniendo compra:", id, "para usuario:", userId);

    const compra = await prisma.compra.findFirst({
      where: {
        id: parseInt(id),
        OR: [
          { compradorId: parseInt(userId) },
          { vendedorId: parseInt(userId) },
        ],
      },
      include: {
        publicacion: {
          include: {
            vendedor: {
              select: {
                id: true,
                nombre: true,
                ubicacion: true,
              },
            },
          },
        },
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            ubicacion: true,
            puntuacionVendedor: true,
            librosVendidos: true,
            librosComprados: true,
          },
        },
        comprador: {
          select: {
            id: true,
            nombre: true,
            ubicacion: true,
          },
        },
      },
    });

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    res.json(compra);
  } catch (error) {
    console.error("[Compra] Error obteniendo compra:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Completar una compra
exports.completarCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log("[Compra] Completando compra:", id, "por usuario:", userId);

    // Verificar que la compra existe y pertenece al usuario
    const compra = await prisma.compra.findFirst({
      where: {
        id: parseInt(id),
        compradorId: parseInt(userId),
      },
    });

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    // Actualizar el estado de la compra
    const compraActualizada = await prisma.compra.update({
      where: { id: parseInt(id) },
      data: { estado: "completado" },
    });

    console.log("[Compra] Compra completada:", compraActualizada.id);

    res.json({
      message: "Compra completada exitosamente",
      compra: compraActualizada,
    });
  } catch (error) {
    console.error("[Compra] Error completando compra:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Cancelar una compra
exports.cancelarCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log("[Compra] Cancelando compra:", id, "por usuario:", userId);

    // Verificar que la compra existe y pertenece al usuario
    const compra = await prisma.compra.findFirst({
      where: {
        id: parseInt(id),
        compradorId: parseInt(userId),
      },
      include: {
        publicacion: true,
      },
    });

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    // Solo permitir cancelar si no está completada
    if (compra.estado === "completado") {
      return res
        .status(400)
        .json({ error: "No se puede cancelar una compra completada" });
    }

    // Restaurar el estado de la publicación a activa
    await prisma.publicacion.update({
      where: { id: compra.publicacionId },
      data: { estado: "activa" },
    });

    // Eliminar la compra
    await prisma.compra.delete({
      where: { id: parseInt(id) },
    });

    console.log("[Compra] Compra cancelada:", id);

    res.json({ message: "Compra cancelada exitosamente" });
  } catch (error) {
    console.error("[Compra] Error cancelando compra:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
