const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

console.log("Cargando rutas de autenticación...");

router.post(
  "/register",
  (req, res, next) => {
    console.log("Ruta /register accedida");
    next();
  },
  authController.register
);

router.post(
  "/login",
  (req, res, next) => {
    console.log("Ruta /login accedida");
    next();
  },
  authController.login
);

console.log("Rutas de autenticación cargadas");

module.exports = router;
