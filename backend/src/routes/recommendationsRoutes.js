const express = require("express");
const router = express.Router();
const recommendationsController = require("../controllers/recommendationsController");

/**
 * GET /api/recommendations/home?userId={userId}
 * Obtiene recomendaciones personalizadas para el home del usuario
 */
router.get("/home", recommendationsController.getHomeRecommendations);

/**
 * POST /api/recommendations/clear-cache
 * Limpia el cache de recomendaciones para un usuario específico (al cerrar sesión)
 */
router.post(
  "/clear-cache",
  recommendationsController.clearUserRecommendationsCache
);

/**
 * GET /api/recommendations/local-sales?userId={userId}
 * Obtiene publicaciones en venta cerca del usuario (misma ciudad)
 */
router.get("/local-sales", recommendationsController.getLocalSales);

module.exports = router;
