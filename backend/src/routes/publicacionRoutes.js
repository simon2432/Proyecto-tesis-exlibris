const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const publicacionController = require("../controllers/publicacionController");

router.use(auth);

router.post(
  "/",
  publicacionController.uploadPublicacionImage,
  publicacionController.crearPublicacion
);
router.get("/", publicacionController.obtenerPublicaciones);
router.get("/mis", publicacionController.obtenerMisPublicaciones);
router.put(
  "/:id",
  publicacionController.uploadPublicacionImage,
  publicacionController.editarPublicacion
);
router.delete(
  "/:id",
  (req, res, next) => {
    console.log("=== RUTA DELETE INTERCEPTADA ===");
    console.log("ID:", req.params.id);
    console.log("User ID:", req.userId);
    next();
  },
  publicacionController.eliminarPublicacion
);
router.get("/:id", publicacionController.obtenerUnaPublicacion);

module.exports = router;
