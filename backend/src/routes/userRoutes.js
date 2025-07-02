const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// Configuración de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../assets/fotosPerfil"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Ruta para subir foto de perfil
router.post(
  "/foto-perfil",
  authMiddleware,
  upload.single("foto"),
  userController.uploadProfilePhoto
);

module.exports = router;
