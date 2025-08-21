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

router.post(
  "/forgot-password",
  (req, res, next) => {
    console.log("Ruta /forgot-password accedida");
    next();
  },
  authController.forgotPassword
);

router.post(
  "/reset-password",
  (req, res, next) => {
    console.log("Ruta /reset-password accedida");
    next();
  },
  authController.resetPassword
);

console.log("Rutas de autenticación cargadas");

module.exports = router;
