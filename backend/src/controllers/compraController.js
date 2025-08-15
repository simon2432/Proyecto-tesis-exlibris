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

// Obtener compra por publicación
exports.obtenerCompraPorPublicacion = async (req, res) => {
  try {
    const { publicacionId } = req.params;
    const userId = req.userId;

    console.log(
      "[Compra] Obteniendo compra para publicación:",
      publicacionId,
      "usuario:",
      userId
    );

    const compra = await prisma.compra.findFirst({
      where: {
        publicacionId: parseInt(publicacionId),
        vendedorId: parseInt(userId), // Solo el vendedor puede ver la compra de su publicación
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
        comprador: {
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
      },
    });

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    console.log("[Compra] Datos del comprador:", {
      id: compra.comprador.id,
      nombre: compra.comprador.nombre,
      email: compra.comprador.email,
      telefono: compra.comprador.telefono,
      ubicacion: compra.comprador.ubicacion,
      puntuacionVendedor: compra.comprador.puntuacionVendedor,
      librosVendidos: compra.comprador.librosVendidos,
      librosComprados: compra.comprador.librosComprados,
    });

    res.json(compra);
  } catch (error) {
    console.error("[Compra] Error obteniendo compra por publicación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Función de prueba para verificar que el controlador esté funcionando
exports.test = async (req, res) => {
  try {
    console.log("[Compra] Test endpoint llamado");
    res.json({
      message: "Controlador de compras funcionando correctamente",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Compra] Error en test:", error);
    res.status(500).json({ error: "Error en test" });
  }
};

// Confirmar transacción desde el lado del comprador
exports.confirmarComprador = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log(
      "[Compra] Comprador confirmando transacción:",
      id,
      "usuario:",
      userId
    );

    // Verificar que la compra existe y pertenece al comprador
    const compra = await prisma.compra.findFirst({
      where: {
        id: parseInt(id),
        compradorId: parseInt(userId),
      },
    });

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    // Solo permitir confirmar si está en estado de encuentro o vendedor_confirmado
    if (
      compra.estado !== "encuentro" &&
      compra.estado !== "vendedor_confirmado"
    ) {
      return res.status(400).json({
        error:
          "Solo se puede confirmar transacciones en estado de encuentro o cuando el vendedor ya confirmó",
      });
    }

    // Marcar como confirmado por el comprador
    const compraActualizada = await prisma.compra.update({
      where: { id: parseInt(id) },
      data: {
        compradorConfirmado: true,
        estado: compra.vendedorConfirmado
          ? "completado"
          : "comprador_confirmado",
      },
    });

    // Si la venta se completó, actualizar el estado de la publicación
    if (compraActualizada.estado === "completado") {
      await prisma.publicacion.update({
        where: { id: compra.publicacionId },
        data: { estado: "vendida" },
      });
      console.log(
        "[Compra] Publicación marcada como vendida:",
        compra.publicacionId
      );
    }

    console.log(
      "[Compra] Comprador confirmó transacción:",
      compraActualizada.id
    );

    res.json({
      message: "Transacción confirmada por el comprador",
      compra: compraActualizada,
    });
  } catch (error) {
    console.error("[Compra] Error confirmando comprador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Confirmar pago desde el lado del vendedor
exports.confirmarVendedor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log("[Compra] Vendedor confirmando pago:", id, "usuario:", userId);

    // Verificar que la compra existe y pertenece al vendedor
    const compra = await prisma.compra.findFirst({
      where: {
        id: parseInt(id),
        vendedorId: parseInt(userId),
      },
    });

    if (!compra) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    // Solo permitir confirmar si está en estado de encuentro o comprador_confirmado
    if (
      compra.estado !== "encuentro" &&
      compra.estado !== "comprador_confirmado"
    ) {
      return res.status(400).json({
        error:
          "Solo se puede confirmar transacciones en estado de encuentro o cuando el comprador ya confirmó",
      });
    }

    // Marcar como confirmado por el vendedor
    const compraActualizada = await prisma.compra.update({
      where: { id: parseInt(id) },
      data: {
        vendedorConfirmado: true,
        estado: compra.compradorConfirmado
          ? "completado"
          : "vendedor_confirmado",
      },
    });

    // Si la venta se completó, actualizar el estado de la publicación
    if (compraActualizada.estado === "completado") {
      await prisma.publicacion.update({
        where: { id: compra.publicacionId },
        data: { estado: "vendida" },
      });
      console.log(
        "[Compra] Publicación marcada como vendida:",
        compra.publicacionId
      );
    }

    console.log("[Compra] Vendedor confirmó pago:", compraActualizada.id);

    res.json({
      message: "Pago confirmado por el vendedor",
      compra: compraActualizada,
    });
  } catch (error) {
    console.error("[Compra] Error confirmando vendedor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Completar una compra (mantener compatibilidad)
exports.completarCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log("[Compra] Completando compra:", id, "por usuario:", userId);

    // Verificar que la compra existe y pertenece al usuario
    const compra = await prisma.compra.findFirst({
      where: {
        id: parseInt(id),
        OR: [
          { compradorId: parseInt(userId) },
          { vendedorId: parseInt(userId) },
        ],
      },
    });

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    // Si es el comprador, confirmar desde su lado
    if (compra.compradorId === parseInt(userId)) {
      return exports.confirmarComprador(req, res);
    }

    // Si es el vendedor, confirmar desde su lado
    if (compra.vendedorId === parseInt(userId)) {
      return exports.confirmarVendedor(req, res);
    }

    res
      .status(403)
      .json({ error: "No tienes permisos para completar esta compra" });
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

// Cancelar una venta (desde el lado del vendedor)
exports.cancelarVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    console.log("[Venta] Cancelando venta:", id, "por usuario:", userId);

    // Verificar que la compra existe y pertenece al vendedor
    const compra = await prisma.compra.findFirst({
      where: {
        id: parseInt(id),
        vendedorId: parseInt(userId),
      },
      include: {
        publicacion: true,
      },
    });

    if (!compra) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    // Solo permitir cancelar si no está completada
    if (compra.estado === "completado") {
      return res
        .status(400)
        .json({ error: "No se puede cancelar una venta completada" });
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

    console.log("[Venta] Venta cancelada:", id);

    res.json({ message: "Venta cancelada exitosamente" });
  } catch (error) {
    console.error("[Venta] Error cancelando venta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Valorar al vendedor (solo comprador, solo una vez, solo si está completada)
exports.valorarVendedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { valoracion } = req.body;
    const userId = req.userId;

    console.log(
      "[Compra] Valorando vendedor:",
      id,
      "valoración:",
      valoracion,
      "usuario:",
      userId
    );

    // Validar que la valoración esté en el rango correcto
    if (!valoracion || valoracion < 1 || valoracion > 5) {
      return res.status(400).json({
        error: "La valoración debe ser un número del 1 al 5",
      });
    }

    // Verificar que la compra existe y pertenece al comprador
    const compra = await prisma.compra.findFirst({
      where: {
        id: parseInt(id),
        compradorId: parseInt(userId),
      },
    });

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    // Solo permitir valorar si está completada
    if (compra.estado !== "completado") {
      return res.status(400).json({
        error: "Solo se puede valorar una venta completada",
      });
    }

    // Verificar que no se haya valorado antes
    if (compra.valoracionComprador) {
      return res.status(400).json({
        error: "Ya has valorado a este vendedor para esta compra",
      });
    }

    // Actualizar la compra con la valoración
    const compraActualizada = await prisma.compra.update({
      where: { id: parseInt(id) },
      data: {
        valoracionComprador: valoracion,
      },
    });

    // Actualizar la puntuación promedio del vendedor
    const todasLasVentas = await prisma.compra.findMany({
      where: {
        vendedorId: compra.vendedorId,
        valoracionComprador: { not: null },
      },
    });

    const totalValoraciones = todasLasVentas.length;
    const sumaValoraciones = todasLasVentas.reduce(
      (sum, c) => sum + c.valoracionComprador,
      0
    );
    const puntuacionPromedio =
      totalValoraciones > 0 ? sumaValoraciones / totalValoraciones : 0;

    await prisma.user.update({
      where: { id: compra.vendedorId },
      data: {
        puntuacionVendedor: puntuacionPromedio,
        cantidadValoraciones: totalValoraciones,
        sumaValoraciones: sumaValoraciones,
      },
    });

    console.log(
      "[Compra] Vendedor valorado:",
      compra.vendedorId,
      "nueva puntuación:",
      puntuacionPromedio
    );

    res.json({
      message: "Vendedor valorado exitosamente",
      compra: compraActualizada,
      nuevaPuntuacionVendedor: puntuacionPromedio,
    });
  } catch (error) {
    console.error("[Compra] Error valorando vendedor:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
