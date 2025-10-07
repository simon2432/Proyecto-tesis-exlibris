const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

console.log("Cargando rutas de autenticación...");

// Rate limiting para prevenir ataques de fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos de login por IP cada 15 minutos
  message: {
    error: "Demasiados intentos de login. Intenta nuevamente en 15 minutos.",
    retryAfter: "15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de registro por IP cada 15 minutos
  message: {
    error: "Demasiados intentos de registro. Intenta nuevamente en 15 minutos.",
    retryAfter: "15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  registerLimiter,
  [
    body("nombre")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("El nombre debe tener entre 2 y 50 caracteres"),
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("telefono")
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage("Teléfono debe tener entre 10 y 15 caracteres"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Contraseña debe tener al menos 8 caracteres")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*?])/)
      .withMessage(
        "Contraseña debe contener: mayúscula, minúscula, número y carácter especial"
      ),
    body("documento")
      .isNumeric()
      .withMessage("Documento debe ser numérico")
      .isLength({ min: 7, max: 15 })
      .withMessage("Documento debe tener entre 7 y 15 dígitos"),
  ],
  (req, res, next) => {
    console.log("Ruta /register accedida");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: errors.array(),
      });
    }
    next();
  },
  authController.register
);

router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("Contraseña es obligatoria"),
  ],
  (req, res, next) => {
    console.log("Ruta /login accedida");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: errors.array(),
      });
    }
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
