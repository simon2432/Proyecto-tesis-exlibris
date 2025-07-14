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
router.get("/:id", publicacionController.obtenerUnaPublicacion);
router.put(
  "/:id",
  publicacionController.uploadPublicacionImage,
  publicacionController.editarPublicacion
);

module.exports = router;
