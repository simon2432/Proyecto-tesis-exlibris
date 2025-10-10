/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR DE RECOMENDACIONES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Maneja las recomendaciones personalizadas de libros:
 * - Recomendaciones del home (ChatGPT + Google Books)
 * - Publicaciones locales (en venta cerca del usuario)
 * - Gestión de caché de recomendaciones
 *
 * FUNCIONALIDADES:
 * - Algoritmo inteligente con ChatGPT (ver homeRecs.js)
 * - Caché persistente por sesión
 * - Publicaciones filtradas por ubicación del usuario
 * ═══════════════════════════════════════════════════════════════════════════
 */

const {
  getHomeRecommendations,
  clearUserCache,
} = require("../services/recs/homeRecs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS DE RECOMENDACIONES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/recommendations/home?userId={userId}
 * Obtiene recomendaciones personalizadas para el home del usuario
 *
 * RETORNA: 10+10 libros (te_podrian_gustar + descubri_nuevas_lecturas)
 * ESTRATEGIA: ChatGPT analiza gustos → Busca en Google Books → Filtra/valida
 * CACHÉ: Persistente durante toda la sesión del usuario
 */
exports.getHomeRecommendations = async (req, res) => {
  try {
    const { userId } = req.query;

    // Validar userId
    if (!userId) {
      return res.status(400).json({
        error: "userId es requerido como query parameter",
      });
    }

    // Validar que userId sea un número válido
    if (isNaN(parseInt(userId))) {
      return res.status(400).json({
        error: "userId debe ser un número válido",
      });
    }

    console.log(
      `[Recommendations] Obteniendo recomendaciones para usuario ${userId}`
    );

    // Obtener recomendaciones
    const recommendations = await getHomeRecommendations(userId);

    console.log(
      `[Recommendations] Recomendaciones generadas con estrategia: ${recommendations.metadata.strategy}`
    );

    res.json(recommendations);
  } catch (error) {
    console.error("[Recommendations] Error:", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener recomendaciones",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * POST /api/recommendations/clear-cache
 * Limpia el caché de recomendaciones de un usuario al cerrar sesión
 *
 * USO: Llamado automáticamente desde UserContext cuando el usuario hace logout
 * EFECTO: El usuario verá nuevas recomendaciones en su próxima sesión
 */
exports.clearUserRecommendationsCache = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "userId es requerido en el body",
      });
    }

    if (isNaN(parseInt(userId))) {
      return res.status(400).json({
        error: "userId debe ser un número válido",
      });
    }

    console.log(`[Recommendations] Limpiando cache para usuario ${userId}`);

    const cleared = clearUserCache(userId);

    res.json({
      message: "Cache de recomendaciones limpiado exitosamente",
      userId: parseInt(userId),
      cleared: cleared,
    });
  } catch (error) {
    console.error("[Recommendations] Error al limpiar cache:", error);
    res.status(500).json({
      error: "Error interno del servidor al limpiar cache",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/recommendations/local-sales?userId={userId}
 * Obtiene publicaciones en venta en la MISMA ciudad del usuario
 *
 * FLUJO:
 * 1. Obtiene la ubicación (ciudad) del usuario
 * 2. Busca publicaciones activas en la misma ciudad
 * 3. Excluye las publicaciones del propio usuario
 * 4. Retorna hasta 15 publicaciones ordenadas por fecha
 *
 * USO: Sección "En venta cerca tuyo" del home
 */
exports.getLocalSales = async (req, res) => {
  try {
    const { userId } = req.query;
    console.log(`[LocalSales] Recibido userId: ${userId}`);

    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }

    // Obtener la ciudad del usuario
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { ubicacion: true },
    });

    console.log(`[LocalSales] Usuario encontrado:`, user);

    if (!user || !user.ubicacion) {
      return res.status(400).json({
        error: "Usuario no encontrado o sin ubicación",
      });
    }

    console.log(
      `[LocalSales] Buscando publicaciones en: "${user.ubicacion}" (excluyendo usuario ${userId})`
    );

    // Buscar publicaciones activas en la misma ciudad, excluyendo las del usuario actual
    const publicaciones = await prisma.publicacion.findMany({
      where: {
        ubicacion: user.ubicacion,
        estado: "activa",
        vendedorId: { not: parseInt(userId) }, // Excluir publicaciones del usuario actual
      },
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaPublicacion: "desc",
      },
      take: 15,
    });

    console.log(
      `[LocalSales] Encontradas ${publicaciones.length} publicaciones`
    );

    // Debug: Mostrar publicaciones del usuario actual que se están excluyendo
    const misPublicaciones = await prisma.publicacion.findMany({
      where: {
        ubicacion: user.ubicacion,
        estado: "activa",
        vendedorId: parseInt(userId),
      },
      select: { id: true, titulo: true },
    });
    console.log(
      `[LocalSales] Publicaciones propias excluidas: ${misPublicaciones.length}`
    );
    if (misPublicaciones.length > 0) {
      console.log(
        `[LocalSales] Mis publicaciones:`,
        misPublicaciones.map((p) => `${p.id}: ${p.titulo}`)
      );
    }

    // Debug: Mostrar todas las ubicaciones disponibles
    const allPublications = await prisma.publicacion.findMany({
      where: { estado: "activa" },
      select: { ubicacion: true, id: true },
    });
    const ubicacionesUnicas = [
      ...new Set(allPublications.map((p) => p.ubicacion)),
    ];
    console.log(
      `[LocalSales] Ubicaciones disponibles en DB:`,
      ubicacionesUnicas
    );
    console.log(
      `[LocalSales] Total publicaciones activas: ${allPublications.length}`
    );

    // Formatear para el frontend
    const resultado = publicaciones.map((pub) => ({
      id: pub.id,
      titulo: pub.titulo,
      autor: pub.autor,
      precio: pub.precio,
      portada: pub.imagenUrl, // Mapear imagenUrl a portada para el frontend
      ubicacion: pub.ubicacion,
      vendedor: {
        id: pub.vendedor.id,
        nombre: pub.vendedor.nombre,
      },
    }));

    console.log(`[LocalSales] Retornando ${resultado.length} publicaciones`);
    res.json({
      publicaciones: resultado,
      ubicacion: user.ubicacion,
      total: resultado.length,
    });
  } catch (error) {
    console.error("[LocalSales] Error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
