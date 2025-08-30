/**
 * Archivo de prueba simple para el sistema de recomendaciones
 * Ejecutar con: node test-recommendations.js
 */

const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testRecommendations() {
  console.log("🧪 Probando sistema de recomendaciones...\n");

  try {
    // 1. Health check
    console.log("1️⃣ Probando health check...");
    const healthResponse = await axios.get(
      `${BASE_URL}/api/recommendations/health`
    );
    console.log("✅ Health check exitoso:", healthResponse.data);
    console.log("");

    // 2. Recomendaciones para usuario 1
    console.log("2️⃣ Probando recomendaciones para usuario 1...");
    const recsResponse = await axios.get(
      `${BASE_URL}/api/recommendations/home?userId=1`
    );
    console.log("✅ Recomendaciones obtenidas exitosamente");
    console.log(`   Estrategia: ${recsResponse.data.metadata.strategy}`);
    console.log(
      `   Te podrían gustar: ${recsResponse.data.tePodrianGustar.length} libros`
    );
    console.log(
      `   Descubrí nuevas lecturas: ${recsResponse.data.descubriNuevasLecturas.length} libros`
    );
    console.log("");

    // 3. Mostrar algunas recomendaciones
    if (recsResponse.data.tePodrianGustar.length > 0) {
      console.log('📚 Ejemplo de "Te podrían gustar":');
      const firstBook = recsResponse.data.tePodrianGustar[0];
      console.log(
        `   - ${firstBook.title} por ${firstBook.authors.join(", ")}`
      );
      console.log(`     Razón: ${firstBook.reason}`);
      console.log("");
    }

    if (recsResponse.data.descubriNuevasLecturas.length > 0) {
      console.log('🔍 Ejemplo de "Descubrí nuevas lecturas":');
      const firstBook = recsResponse.data.descubriNuevasLecturas[0];
      console.log(
        `   - ${firstBook.title} por ${firstBook.authors.join(", ")}`
      );
      console.log(`     Razón: ${firstBook.reason}`);
      console.log("");
    }

    // 4. Invalidar cache
    console.log("3️⃣ Probando invalidación de cache...");
    const invalidateResponse = await axios.post(
      `${BASE_URL}/api/recommendations/invalidate`,
      {
        userId: "1",
      }
    );
    console.log(
      "✅ Cache invalidado exitosamente:",
      invalidateResponse.data.message
    );
    console.log("");

    console.log("🎉 Todas las pruebas pasaron exitosamente!");
  } catch (error) {
    console.error("❌ Error en las pruebas:", error.message);

    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }

    console.log("\n💡 Asegúrate de que:");
    console.log("   1. El servidor esté corriendo en http://localhost:3000");
    console.log("   2. Las variables de entorno estén configuradas");
    console.log("   3. La base de datos esté conectada");
  }
}

// Ejecutar pruebas
testRecommendations();
