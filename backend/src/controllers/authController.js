const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, documento, ubicacion } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        documento: documento ? parseInt(documento) : undefined,
        ubicacion,
      },
    });
    return res
      .status(201)
      .json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    return res.status(500).json({ error: "Error en el registro" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(400)
        .json({ error: "Usuario o contraseña incorrectos" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res
        .status(400)
        .json({ error: "Usuario o contraseña incorrectos" });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    // No enviar password al frontend
    const { password: _, ...userData } = user;
    return res.json({ token, user: userData });
  } catch (error) {
    return res.status(500).json({ error: "Error en el login" });
  }
};
