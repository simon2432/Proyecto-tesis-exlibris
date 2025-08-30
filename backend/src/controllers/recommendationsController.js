const {
  getHomeRecommendations,
  invalidateRecommendationsCache,
  checkCacheStatus,
} = require("../services/recs/homeRecs");

/**
 * GET /api/recommendations/home
 * Obtiene recomendaciones personalizadas para el home del usuario
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
 * POST /api/recommendations/invalidate
 * Invalida el cache de recomendaciones para un usuario específico
 */
exports.invalidateRecommendations = async (req, res) => {
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

    console.log(`[Recommendations] Invalidando cache para usuario ${userId}`);

    invalidateRecommendationsCache(userId);

    res.json({
      message: "Cache de recomendaciones invalidado exitosamente",
      userId: parseInt(userId),
    });
  } catch (error) {
    console.error("[Recommendations] Error al invalidar cache:", error);
    res.status(500).json({
      error: "Error interno del servidor al invalidar cache",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/recommendations/health
 * Endpoint de salud para verificar el estado del servicio
 */
exports.getHealth = async (req, res) => {
  try {
    res.json({
      status: "healthy",
      service: "recommendations",
      timestamp: new Date().toISOString(),
      features: {
        llm: !!process.env.OPENAI_API_KEY,
        googleBooks: !!process.env.GOOGLE_BOOKS_API_KEY,
        cache: true,
      },
    });
  } catch (error) {
    console.error("[Recommendations] Health check error:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
    });
  }
};

/**
 * GET /api/recommendations/cache-status
 * Verifica el estado del caché para un usuario específico
 */
exports.getCacheStatus = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: "userId es requerido como query parameter",
      });
    }

    if (isNaN(parseInt(userId))) {
      return res.status(400).json({
        error: "userId debe ser un número válido",
      });
    }

    console.log(
      `[Recommendations] Verificando estado del caché para usuario ${userId}`
    );

    const cacheStatus = checkCacheStatus(userId);

    res.json(cacheStatus);
  } catch (error) {
    console.error("[Recommendations] Error al verificar caché:", error);
    res.status(500).json({
      error: "Error interno del servidor al verificar caché",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
