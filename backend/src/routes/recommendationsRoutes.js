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
 * GET /api/recommendations/cache-status?userId={userId}
 * Verifica el estado del caché para un usuario específico
 */
router.get("/cache-status", recommendationsController.getCacheStatus);

/**
 * GET /api/recommendations/health
 * Endpoint de salud para verificar el estado del servicio
 */
router.get("/health", recommendationsController.getHealth);

module.exports = router;
