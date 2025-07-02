const express = require("express");
const router = express.Router();
const lecturaController = require("../controllers/lecturaController");
const authMiddleware = require("../middleware/authMiddleware");

// Obtener lecturas del usuario autenticado
router.get("/mias", authMiddleware, lecturaController.getMisLecturas);
// Crear una nueva lectura
router.post("/", authMiddleware, lecturaController.crearLectura);
// Obtener detalle de una lectura
router.get("/:id", authMiddleware, lecturaController.getLectura);
// Actualizar fechas o reseña de una lectura
router.put("/:id", authMiddleware, lecturaController.actualizarLectura);
// Eliminar una lectura
router.delete("/:id", authMiddleware, lecturaController.eliminarLectura);

module.exports = router;
