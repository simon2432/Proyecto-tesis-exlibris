const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", async (req, res) => {
  res.json({ message: "Backend de TFG Libros activo" });
});

const publicacionRoutes = require("./routes/publicacionRoutes");
app.use("/publicaciones", publicacionRoutes);

const compraRoutes = require("./routes/compraRoutes");
app.use("/compras", compraRoutes);

const lecturaRoutes = require("./routes/lecturaRoutes");
app.use("/lecturas", lecturaRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
