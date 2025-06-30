const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const lecturaController = require("../controllers/lecturaController");

router.use(auth);

router.post("/", lecturaController.agregarLectura);
router.get("/mis", lecturaController.obtenerLecturas);
router.patch("/:id", lecturaController.actualizarLectura);
router.delete("/:id", lecturaController.eliminarLectura);

module.exports = router;
