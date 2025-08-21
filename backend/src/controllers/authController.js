const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

exports.register = async (req, res) => {
  try {
    console.log("Register attempt:", {
      email: req.body.email,
      nombre: req.body.nombre,
    });
    const { nombre, email, telefono, password, documento, ubicacion } =
      req.body;
    if (!nombre || !email || !telefono || !password) {
      console.log("Missing fields:", {
        nombre: !!nombre,
        email: !!email,
        telefono: !!telefono,
        password: !!password,
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
        documento: documento ? parseInt(documento) : undefined,
        ubicacion,
      },
    });

    // Generar token para el usuario registrado
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
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

exports.login = async (req, res) => {
  try {
    console.log("Login attempt:", { email: req.body.email });
    const { email, password } = req.body;
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
      expiresIn: "7d",
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
    return res
      .status(500)
      .json({
        error: "Error al procesar la solicitud",
        details: error.message,
      });
  }
};

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
    return res
      .status(500)
      .json({
        error: "Error al actualizar la contraseña",
        details: error.message,
      });
  }
};
