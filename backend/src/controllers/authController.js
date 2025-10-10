/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR DE AUTENTICACIÓN
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Maneja todo lo relacionado con autenticación de usuarios:
 * - Registro de nuevos usuarios
 * - Login (inicio de sesión)
 * - Recuperación de contraseña (forgot password)
 * - Reset de contraseña
 *
 * SEGURIDAD:
 * - Contraseñas hasheadas con bcrypt
 * - Tokens JWT con expiración configurable
 * - Validación estricta de JWT_SECRET
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN Y VALIDACIÓN DE SEGURIDAD
// ═══════════════════════════════════════════════════════════════════════════

// Validar JWT Secret al iniciar (crítico para seguridad)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ CRÍTICO: JWT_SECRET no configurado. Sistema inseguro.");
  process.exit(1);
}

if (JWT_SECRET.length < 32) {
  console.error("❌ CRÍTICO: JWT_SECRET muy corto. Mínimo 32 caracteres.");
  process.exit(1);
}

console.log("✅ JWT Secret configurado correctamente");

// Configurar tiempo de expiración del token
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
console.log("✅ JWT Expires In configurado:", JWT_EXPIRES_IN);

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS DE AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /auth/register
 * Registra un nuevo usuario en el sistema
 *
 * FLUJO:
 * 1. Valida que todos los campos obligatorios estén presentes
 * 2. Verifica que el email no esté ya registrado
 * 3. Hashea la contraseña con bcrypt
 * 4. Crea el usuario en la base de datos
 * 5. Genera token JWT automáticamente
 * 6. Retorna token + datos del usuario (sin password)
 */
exports.register = async (req, res) => {
  try {
    console.log("Register attempt:", {
      email: req.body.email,
      nombre: req.body.nombre,
    });
    const { nombre, email, telefono, password, documento, ubicacion } =
      req.body;

    // Las validaciones básicas ya se hicieron en el middleware
    // Solo verificamos que los datos lleguen (redundante pero seguro)
    if (!nombre || !email || !telefono || !password || !documento) {
      console.log("Missing fields:", {
        nombre: !!nombre,
        email: !!email,
        telefono: !!telefono,
        password: !!password,
        documento: !!documento,
      });
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    console.log("Checking if user exists");
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    console.log("Creating new user");
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nombre,
        email,
        telefono,
        password: hashedPassword,
        documento: parseInt(documento),
        ubicacion,
      },
    });

    // Generar token para el usuario registrado
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // No enviar password al frontend
    const { password: _, ...userData } = user;

    console.log("User registered successfully:", email);
    return res.status(201).json({
      message: "Usuario registrado correctamente",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res
      .status(500)
      .json({ error: "Error en el registro", details: error.message });
  }
};

/**
 * POST /auth/login
 * Inicia sesión de un usuario existente
 *
 * FLUJO:
 * 1. Valida que email y password estén presentes
 * 2. Busca el usuario en la base de datos
 * 3. Compara la contraseña con bcrypt
 * 4. Genera token JWT con expiración de 7 días
 * 5. Retorna token + datos del usuario (sin password)
 */
exports.login = async (req, res) => {
  try {
    console.log("Login attempt:", { email: req.body.email });
    const { email, password } = req.body;

    // Las validaciones básicas ya se hicieron en el middleware
    if (!email || !password) {
      console.log("Missing fields:", { email: !!email, password: !!password });
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    console.log("Searching for user with email:", email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("User not found for email:", email);
      return res
        .status(400)
        .json({ error: "Usuario o contraseña incorrectos" });
    }

    console.log("User found, comparing passwords");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log("Invalid password for user:", email);
      return res
        .status(400)
        .json({ error: "Usuario o contraseña incorrectos" });
    }

    console.log("Password valid, generating token");
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    // No enviar password al frontend
    const { password: _, ...userData } = user;
    console.log("Login successful for user:", email);
    return res.json({ token, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ error: "Error en el login", details: error.message });
  }
};

/**
 * POST /auth/forgot-password
 * Inicia el proceso de recuperación de contraseña
 *
 * FLUJO:
 * 1. Verifica que el email exista en la base de datos
 * 2. Genera token JWT de reseteo (válido por 1 hora)
 * 3. Retorna el token (en producción debería enviarse por email)
 *
 * NOTA: Actualmente retorna el token directamente (desarrollo)
 */
exports.forgotPassword = async (req, res) => {
  try {
    console.log("Forgot password attempt for email:", req.body.email);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El email es obligatorio" });
    }

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ error: "No se encontró un usuario con ese email" });
    }

    // Generar un token temporal para reset de contraseña (válido por 1 hora)
    const resetToken = jwt.sign(
      { userId: user.id, type: "password_reset" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Password reset token generated for user:", email);
    return res.json({
      message: "Se ha enviado un enlace de recuperación a tu email",
      resetToken,
      userId: user.id,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      error: "Error al procesar la solicitud",
      details: error.message,
    });
  }
};

/**
 * POST /auth/reset-password
 * Completa el proceso de reseteo de contraseña con el token
 *
 * FLUJO:
 * 1. Valida el token JWT de reseteo
 * 2. Verifica que las contraseñas coincidan
 * 3. Hashea la nueva contraseña con bcrypt
 * 4. Actualiza la contraseña en la base de datos
 */
exports.resetPassword = async (req, res) => {
  try {
    console.log("Reset password attempt");
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Las contraseñas no coinciden" });
    }

    // Validar que la contraseña tenga al menos 6 caracteres
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    try {
      // Verificar el token
      const decoded = jwt.verify(resetToken, JWT_SECRET);

      if (decoded.type !== "password_reset") {
        return res.status(400).json({ error: "Token inválido" });
      }

      const userId = decoded.userId;

      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Hashear la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar la contraseña del usuario
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      console.log("Password reset successful for user ID:", userId);
      return res.json({ message: "Contraseña actualizada correctamente" });
    } catch (jwtError) {
      return res.status(400).json({ error: "Token expirado o inválido" });
    }
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      error: "Error al actualizar la contraseña",
      details: error.message,
    });
  }
};
