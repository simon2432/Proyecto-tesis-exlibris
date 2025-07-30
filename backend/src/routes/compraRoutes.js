const express = require("express");
const router = express.Router();
const compraController = require("../controllers/compraController");
const authMiddleware = require("../middleware/authMiddleware");

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Crear una nueva compra
router.post("/", compraController.crearCompra);

// Obtener compras del usuario (como comprador)
router.get("/mis-compras", compraController.obtenerCompras);

// Obtener ventas del usuario (como vendedor)
router.get("/mis-ventas", compraController.obtenerVentas);

// Obtener compra por publicación
router.get(
  "/publicacion/:publicacionId",
  compraController.obtenerCompraPorPublicacion
);

// Obtener una compra específica
router.get("/:id", compraController.obtenerUnaCompra);

// Completar una compra
router.patch("/:id/completar", compraController.completarCompra);

// Cancelar una compra
router.patch("/:id/cancelar", compraController.cancelarCompra);

// Cancelar una venta
router.patch("/:id/cancelar-venta", compraController.cancelarVenta);

module.exports = router;
