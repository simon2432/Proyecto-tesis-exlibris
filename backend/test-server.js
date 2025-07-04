const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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

// Ruta raíz
app.get("/", (req, res) => {
  res.json({ message: "Servidor de prueba funcionando" });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Servidor de prueba corriendo en http://localhost:${PORT}`);
});
