const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const compraController = require("../controllers/compraController");

router.use(auth);

router.post("/", compraController.crearCompra);
router.get("/mis", compraController.obtenerMisCompras);
router.get("/ventas", compraController.obtenerMisVentas);
router.patch("/:id", compraController.actualizarEstadoCompra);

module.exports = router;
