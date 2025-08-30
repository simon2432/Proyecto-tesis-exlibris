const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Middleware de logging simplificado
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Ruta de prueba
app.get("/", async (req, res) => {
  res.json({ message: "Backend de TFG Libros activo" });
});

// Ruta de prueba simple
app.get("/ping", (req, res) => {
  console.log("Ping recibido");
  res.json({ message: "pong", timestamp: new Date().toISOString() });
});

// Ruta de login de prueba
app.post("/test-login", (req, res) => {
  console.log("Test login recibido:", req.body);
  res.json({
    message: "Test login funcionando",
    receivedData: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Ruta para probar la conexión a la base de datos
app.get("/test-db", async (req, res) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    res.json({
      message: "Conexión a la base de datos exitosa",
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      error: "Error de conexión a la base de datos",
      details: error.message,
    });
  }
});

const publicacionRoutes = require("./routes/publicacionRoutes");
app.use("/publicaciones", publicacionRoutes);

const compraRoutes = require("./routes/compraRoutes");
app.use("/compras", compraRoutes);

const lecturaRoutes = require("./routes/lecturaRoutes");
app.use("/lecturas", lecturaRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

const bookRoutes = require("./routes/bookRoutes");
app.use("/books", bookRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use(chatRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/usuarios", userRoutes);

const recommendationsRoutes = require("./routes/recommendationsRoutes");
app.use("/api/recommendations", recommendationsRoutes);

app.use(
  "/assets/fotosPerfil",
  express.static(path.join(__dirname, "../assets/fotosPerfil"))
);
app.use(
  "/assets/publicaciones",
  express.static(path.join(__dirname, "../assets/publicaciones"))
);

// Middleware de manejo de errores (comentado temporalmente)
// app.use((error, req, res, next) => {
//   console.error("Error no manejado:", error);
//   res.status(500).json({
//     error: "Error interno del servidor",
//     details: error.message,
//     stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//   });
// });

// Middleware para rutas no encontradas (comentado temporalmente)
// app.use((req, res) => {
//   console.log("Ruta no encontrada:", req.method, req.path);
//   res.status(404).json({ error: "Ruta no encontrada" });
// });

// Manejo de errores global
process.on("uncaughtException", (error) => {
  console.error("Error no capturado:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promesa rechazada no manejada:", reason);
});

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`Servidor también disponible en http://localhost:${PORT}`);
  console.log("Variables de entorno cargadas:", {
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? "Configurada" : "No configurada",
    JWT_SECRET: process.env.JWT_SECRET ? "Configurado" : "No configurado",
  });
});

// Manejo de errores del servidor
server.on("error", (error) => {
  console.error("Error del servidor:", error);
});
