const express = require("express");
const router = express.Router();
const recommendationsController = require("../controllers/recommendationsController");

/**
 * GET /api/recommendations/home?userId={userId}
 * Obtiene recomendaciones personalizadas para el home del usuario
 */
router.get("/home", recommendationsController.getHomeRecommendations);

/**
 * POST /api/recommendations/invalidate
 * Invalida el cache de recomendaciones para un usuario específico
 */
router.post("/invalidate", recommendationsController.invalidateRecommendations);

/**
 * POST /api/recommendations/clear-cache
 * Limpia el cache de recomendaciones para un usuario específico (al cerrar sesión)
 */
router.post(
  "/clear-cache",
  recommendationsController.clearUserRecommendationsCache
);

/**
 * GET /api/recommendations/cache-status?userId={userId}
 * Verifica el estado del caché para un usuario específico
 */
router.get("/cache-status", recommendationsController.getCacheStatus);

/**
 * GET /api/recommendations/local-sales?userId={userId}
 * Obtiene publicaciones en venta cerca del usuario (misma ciudad)
 */
router.get("/local-sales", recommendationsController.getLocalSales);

/**
 * GET /api/recommendations/health
 * Endpoint de salud para verificar el estado del servicio
 */
router.get("/health", recommendationsController.getHealth);

module.exports = router;
