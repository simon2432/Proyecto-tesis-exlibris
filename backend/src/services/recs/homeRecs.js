/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA DE RECOMENDACIONES INTELIGENTES - HOME
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Este archivo contiene el algoritmo principal de recomendaciones que combina:
 *
 * 1. ChatGPT (GPT-4o): Analiza los gustos del usuario y recomienda 40 libros
 * 2. Google Books API: Busca cada libro recomendado y obtiene imágenes/descripciones
 * 3. Sistema de Caché: Guarda las recomendaciones por sesión para consistencia
 * 4. Fallbacks: Usa libros por defecto si algo falla
 *
 * FLUJO PRINCIPAL:
 * Usuario → Verificar caché → Obtener señales (favoritos/historial) →
 * ChatGPT → Buscar en Google Books → Filtrar/Validar → Guardar en caché →
 * Retornar 10+10 libros con imágenes
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { getDefaultRecommendations } = require("./homeDefaults");

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN E INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════

// Verificar que PrismaClient esté disponible
let prisma;
try {
  prisma = new PrismaClient();
  console.log("[Prisma] Cliente inicializado correctamente");
} catch (error) {
  console.error("[Prisma] Error inicializando cliente:", error);
  throw error;
}

// Función para obtener o reinicializar Prisma
const getPrismaClient = () => {
  console.log(
    `[Prisma] Estado actual: prisma = ${prisma ? "disponible" : "undefined"}`
  );

  try {
    if (!prisma) {
      console.log("[Prisma] Creando nuevo cliente...");
      prisma = new PrismaClient();
      console.log("[Prisma] Cliente creado correctamente");
    }

    console.log(`[Prisma] Devolviendo cliente: ${prisma ? "OK" : "ERROR"}`);
    return prisma;
  } catch (error) {
    console.error("[Prisma] Error creando cliente:", error);
    // Intentar crear un cliente fresco
    try {
      console.log("[Prisma] Intentando crear cliente fresco...");
      const freshClient = new PrismaClient();
      console.log("[Prisma] Cliente fresco creado correctamente");
      return freshClient;
    } catch (freshError) {
      console.error("[Prisma] Error creando cliente fresco:", freshError);
      throw freshError;
    }
  }
};
// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE APIs Y CACHÉ
// ═══════════════════════════════════════════════════════════════════════════

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// CACHÉ DE RECOMENDACIONES:
// - Persistente durante toda la sesión del usuario
// - Se invalida solo al cerrar sesión (logout) o reiniciar servidor
// - Garantiza que el usuario vea las MISMAS recomendaciones durante toda su sesión
// - Evita llamadas innecesarias a ChatGPT y Google Books
const recommendationsCache = new Map();
const CACHE_DURATION = Infinity; // Caché permanente hasta invalidación explícita

// Función helper para guardar en cache (solo en memoria, por sesión)
const setCacheAndSave = (key, value) => {
  recommendationsCache.set(key, value);
  console.log(
    `[Cache] Cache actualizado en memoria: ${recommendationsCache.size} entradas`
  );
};

// Función para limpiar cache de un usuario específico (al cerrar sesión)
const clearUserCache = (userId) => {
  const cacheKey = `home_recs_${userId}`;
  const deleted = recommendationsCache.delete(cacheKey);
  console.log(
    `[Cache] Cache limpiado para usuario ${userId}: ${
      deleted ? "eliminado" : "no encontrado"
    }`
  );
  return deleted;
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES PARA MANEJO DE RESPUESTAS DE CHATGPT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detecta si una respuesta JSON de ChatGPT está cortada o incompleta
 * Verifica que tenga la estructura completa esperada
 */
const isJSONTruncated = (jsonString) => {
  const trimmed = jsonString.trim();
  return (
    !trimmed.endsWith("}") ||
    !trimmed.includes('"descubri_nuevas_lecturas"') ||
    (trimmed.match(/"descubri_nuevas_lecturas"/g) || []).length === 0
  );
};

/**
 * Intenta reparar un JSON mal formateado de ChatGPT
 * Aplica correcciones comunes: comillas sin cerrar, backslashes, etc.
 */
const tryRepairJSON = (jsonString) => {
  try {
    // Intentar reparar comillas sin cerrar
    let repaired = jsonString
      .replace(/"([^"]*?)(?=\s*[,}\]])/g, '"$1"') // Cerrar comillas antes de , } ]
      .replace(/(?<=[,{\[])\s*"([^"]*?)(?=\s*[,}\]])/g, '"$1"') // Cerrar comillas después de , { [
      .replace(/(?<=[^\\])\\(?=[^"\\\/bfnrt])/g, "\\\\") // Escapar backslashes
      .replace(/(?<!\\)"(?=[^"]*"[^"]*:)/g, '\\"'); // Escapar comillas en valores

    // Intentar parsear
    JSON.parse(repaired);
    return repaired;
  } catch (error) {
    console.log("❌ No se pudo reparar el JSON:", error.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OBTENCIÓN DE SEÑALES DEL USUARIO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtiene las "señales" del usuario para personalizar recomendaciones
 *
 * SEÑALES QUE OBTIENE:
 * - favoritos: Top 3 libros favoritos (objetos completos con título/autores)
 * - historialLikes: Títulos de libros con rating >= 3 (le gustaron)
 * - historialDislikes: Títulos de libros con rating <= 2 (no le gustaron)
 * - historialCompleto: IDs de TODOS los libros leídos (para filtrar)
 *
 * ESTAS SEÑALES SE ENVÍAN A CHATGPT para que entienda los gustos del usuario
 */
const getUserSignals = async (userId) => {
  try {
    console.log(`[Signals] Obteniendo señales para usuario ${userId}`);

    // Verificar que prisma esté disponible
    if (!prisma) {
      throw new Error("Prisma client no está inicializado");
    }

    // Obtener cliente de Prisma
    const prismaClient = getPrismaClient();

    // Obtener usuario con favoritos
    const user = await prismaClient.user.findUnique({
      where: { id: parseInt(userId) },
      select: { librosFavoritos: true },
    });

    // Obtener historial de lecturas
    const lecturas = await prismaClient.lectura.findMany({
      where: { userId: parseInt(userId) },
    });

    console.log(`[Signals] Lecturas encontradas: ${lecturas.length}`);

    // Procesar favoritos
    const favoritos = [];
    console.log("[Signals] Raw librosFavoritos:", user?.librosFavoritos);
    console.log(
      "[Signals] Tipo de librosFavoritos:",
      typeof user?.librosFavoritos
    );

    if (user?.librosFavoritos) {
      try {
        // Verificar si ya es un objeto o necesita parsing
        let favs;
        if (typeof user.librosFavoritos === "string") {
          console.log("[Signals] Parseando JSON string...");
          favs = JSON.parse(user.librosFavoritos);
        } else if (Array.isArray(user.librosFavoritos)) {
          console.log("[Signals] Ya es un array");
          favs = user.librosFavoritos;
        } else {
          console.log(
            "[Signals] librosFavoritos no es un array válido:",
            typeof user.librosFavoritos
          );
          favs = [];
        }

        console.log("[Signals] Favoritos parseados:", favs);

        if (Array.isArray(favs)) {
          console.log(`[Signals] Procesando ${favs.length} favoritos`);
          // Solo obtener los títulos de los favoritos (top 3)
          for (const fav of favs.slice(0, 3)) {
            if (fav && fav.id && fav.title) {
              favoritos.push({
                volumeId: fav.id,
                title: fav.title,
                authors: fav.authors || [],
                categories: [],
                description: "",
              });
              console.log(
                `[Signals] Favorito agregado: ${fav.title} por ${(
                  fav.authors || []
                ).join(", ")}`
              );
            }
          }
        }
      } catch (e) {
        console.error("Error parsing favoritos:", e);
        console.log("librosFavoritos raw:", user.librosFavoritos);
      }
    }

    console.log(`[Signals] Favoritos procesados: ${favoritos.length}`);

    // Separar historial en likes/dislikes
    const historialLikes = [];
    const historialDislikes = [];
    const historialCompleto = [];

    for (const lectura of lecturas) {
      historialCompleto.push(lectura.libroId);

      if (lectura.reviewRating) {
        // Solo guardar el título del libro
        const titulo = lectura.titulo || "Título no disponible";

        if (lectura.reviewRating >= 3) {
          historialLikes.push(titulo);
        } else {
          historialDislikes.push(titulo);
        }
      }
    }

    console.log(
      `[Signals] Historial LIKES (rating >= 3): ${historialLikes.length} libros`
    );
    console.log(
      `[Signals] Historial DISLIKES (rating <= 2): ${historialDislikes.length} libros`
    );
    console.log(
      `[Signals] Historial completo: ${historialCompleto.length} libros`
    );

    // Log detallado de títulos
    if (historialLikes.length > 0) {
      console.log(`[Signals] LIKES títulos:`, historialLikes);
    }
    if (historialDislikes.length > 0) {
      console.log(`[Signals] DISLIKES títulos:`, historialDislikes);
    } else {
      console.log(`[Signals] No hay libros con rating <= 2 (dislikes)`);
    }

    const signals = {
      favoritos,
      historialLikes,
      historialDislikes,
      historialCompleto,
    };

    console.log(`[Signals] Señales finales:`, JSON.stringify(signals, null, 2));
    console.log(`[Signals] RESUMEN FINAL:`);
    console.log(`- Favoritos: ${signals.favoritos.length} libros`);
    console.log(`- Historial LIKES: ${signals.historialLikes.length} libros`);
    console.log(
      `- Historial DISLIKES: ${signals.historialDislikes.length} libros`
    );
    console.log(
      `- Historial completo: ${signals.historialCompleto.length} libros`
    );

    return signals;
  } catch (error) {
    console.error("Error getting user signals:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BÚSQUEDA EN GOOGLE BOOKS API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Busca un libro específico en Google Books API y retorna la MEJOR versión
 *
 * ENTRADA: Título y autor (ej: "El Alquimista", "Paulo Coelho")
 * PROCESO:
 *   1. Busca en Google Books API con el query "El Alquimista Paulo Coelho"
 *   2. Obtiene hasta 5 resultados
 *   3. Prioriza por calidad (imagen > autor > descripción)
 *   4. Retorna el mejor resultado
 *
 * SALIDA: Libro completo con imagen, descripción, categorías, etc.
 *
 * OPTIMIZACIONES:
 * - Solo busca 5 resultados (más rápido)
 * - Timeout de 5 segundos
 * - Retry automático si hay rate limiting (error 429)
 * - Usa prioritizeBooksByQuality para elegir la mejor versión
 */
const searchSpecificBook = async (titulo, autor) => {
  // Usar búsqueda flexible como la barra de búsqueda
  let searchQuery;
  if (autor && autor.trim() !== "") {
    searchQuery = `${titulo} ${autor}`;
  } else {
    searchQuery = titulo;
  }

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?key=${GOOGLE_BOOKS_API_KEY}`,
      {
        params: {
          q: searchQuery,
          maxResults: 5, // Reducido para mayor velocidad
          printType: "books",
          orderBy: "relevance",
        },
        timeout: 5000, // Timeout más corto
      }
    );

    if (!response.data.items || response.data.items.length === 0) {
      console.log(`[Search] No se encontró: "${titulo}" por "${autor}"`);
      return null;
    }

    // Convertir a formato estándar
    const allBooks = response.data.items.map((item) => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || [],
      categories: item.volumeInfo.categories || [],
      description: item.volumeInfo.description,
      language: item.volumeInfo.language,
      pageCount: item.volumeInfo.pageCount,
      averageRating: item.volumeInfo.averageRating,
      image:
        item.volumeInfo.imageLinks?.thumbnail ||
        item.volumeInfo.imageLinks?.smallThumbnail ||
        "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen",
    }));

    // Usar la misma lógica de priorización que la barra de búsqueda
    const { prioritizeBooksByQuality } = require("./preferredBooks");
    const prioritizedBooks = prioritizeBooksByQuality(allBooks, titulo);

    // Tomar el primer resultado priorizado
    const firstBook = prioritizedBooks[0];
    if (!firstBook) {
      console.log(`[Search] No se encontró ningún libro para "${titulo}"`);
      return null;
    }

    // Convertir al formato esperado
    const book = {
      volumeId: firstBook.id,
      title: firstBook.title,
      authors: firstBook.authors,
      categories: firstBook.categories,
      description: firstBook.description,
      language: firstBook.language,
      pageCount: firstBook.pageCount,
      averageRating: firstBook.averageRating,
      image: firstBook.image,
    };

    console.log(
      `[Search] ✅ Libro encontrado: "${book.title}" por ${book.authors.join(
        ", "
      )}`
    );
    return book;
  } catch (error) {
    if (error.response?.status === 429) {
      console.log(
        `[Search] Rate limit alcanzado para "${titulo}", esperando 8 segundos...`
      );
      await new Promise((resolve) => setTimeout(resolve, 8000));
      // Intentar una vez más después del delay
      try {
        const retryResponse = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?key=${GOOGLE_BOOKS_API_KEY}`,
          {
            params: {
              q: searchQuery,
              maxResults: 20,
              printType: "books",
              orderBy: "relevance",
            },
            timeout: 10000,
          }
        );

        if (retryResponse.data.items && retryResponse.data.items.length > 0) {
          const allBooks = retryResponse.data.items.map((item) => ({
            id: item.id,
            title: item.volumeInfo.title,
            authors: item.volumeInfo.authors || [],
            categories: item.volumeInfo.categories || [],
            description: item.volumeInfo.description,
            language: item.volumeInfo.language,
            pageCount: item.volumeInfo.pageCount,
            averageRating: item.volumeInfo.averageRating,
            image:
              item.volumeInfo.imageLinks?.thumbnail ||
              item.volumeInfo.imageLinks?.smallThumbnail ||
              "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen",
          }));

          const { prioritizeBooksByQuality } = require("./preferredBooks");
          const prioritizedBooks = prioritizeBooksByQuality(allBooks, titulo);
          const firstBook = prioritizedBooks[0];

          if (firstBook) {
            return {
              volumeId: firstBook.id,
              title: firstBook.title,
              authors: firstBook.authors,
              categories: firstBook.categories,
              description: firstBook.description,
              language: firstBook.language,
              pageCount: firstBook.pageCount,
              averageRating: firstBook.averageRating,
              image: firstBook.image,
            };
          }
        }
      } catch (retryError) {
        console.log(
          `[Search] Retry falló para "${titulo}":`,
          retryError.message
        );
      }
    } else {
      console.error(`Error searching book "${titulo}":`, error.message);
    }
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRACIÓN CON CHATGPT (GPT-4o)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Llama a ChatGPT (GPT-4o) para generar recomendaciones personalizadas
 *
 * ENTRADA: Señales del usuario (favoritos, likes, dislikes)
 * PROCESO:
 *   1. Construye prompt con los gustos del usuario
 *   2. Envía a ChatGPT: "Este usuario leyó X, le gustó Y, no le gustó Z"
 *   3. ChatGPT analiza y recomienda 40 libros (20 + 20)
 *   4. Parsea la respuesta JSON
 *   5. Si falla, intenta reparar el JSON automáticamente
 *   6. Si aún falla, reintenta con prompt de corrección
 *
 * SALIDA: { te_podrian_gustar: [20 libros], descubri_nuevas_lecturas: [20 libros] }
 *         (solo título + autor, sin imágenes todavía)
 *
 * MODELO: GPT-4o (más inteligente para recomendaciones complejas)
 * TOKENS: Máximo 2500
 * TEMPERATURE: 0.7 (balance entre creatividad y precisión)
 */
const callLLMForPicks = async (signals) => {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key no configurada");
    return null;
  }

  try {
    const prompt = buildLLMPrompt(signals);

    // Log detallado del prompt enviado a ChatGPT
    console.log("=".repeat(80));
    console.log("🤖 ENVIANDO CONSULTA A CHATGPT");
    console.log("=".repeat(80));
    console.log("👤 SEÑALES DEL USUARIO:");
    console.log("📚 Favoritos:", JSON.stringify(signals.favoritos, null, 2));
    console.log("👍 Historial LIKES:", signals.historialLikes);
    console.log("👎 Historial DISLIKES:", signals.historialDislikes);
    console.log(
      `[LLM] Enviando ${signals.historialDislikes.length} dislikes al chat`
    );
    console.log(
      "📖 Historial Completo:",
      signals.historialCompleto.length,
      "libros"
    );
    console.log("=".repeat(80));
    console.log("📝 SYSTEM PROMPT:");
    console.log(prompt.system);
    console.log("\n📝 USER PROMPT:");
    console.log(prompt.user);
    console.log("=".repeat(80));

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: prompt.system,
          },
          {
            role: "user",
            content: prompt.user,
          },
        ],
        max_tokens: 2500,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 60000, // 60 segundos - más tiempo para respuestas complejas
      }
    );

    const content = response.data.choices[0].message.content;

    // Log detallado de la respuesta de ChatGPT
    console.log("=".repeat(80));
    console.log("🤖 RESPUESTA DE CHATGPT");
    console.log("=".repeat(80));
    console.log("📄 RESPUESTA RAW:");
    console.log(content);
    console.log("=".repeat(80));

    // Análisis detallado del contenido
    console.log("🔍 ANÁLISIS DETALLADO:");
    console.log(`- Longitud total: ${content.length} caracteres`);
    console.log(`- Primeros 200 caracteres: ${content.substring(0, 200)}`);
    console.log(
      `- Últimos 200 caracteres: ${content.substring(
        Math.max(0, content.length - 200)
      )}`
    );
    console.log(`- Contiene { al inicio: ${content.trim().startsWith("{")}`);
    console.log(`- Contiene } al final: ${content.trim().endsWith("}")}`);
    console.log("=".repeat(80));

    try {
      // Limpiar la respuesta antes de parsear
      let cleanContent = content.trim();

      // Buscar el JSON válido en la respuesta
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      console.log("🧹 CONTENIDO LIMPIO:");
      console.log(cleanContent);
      console.log("=".repeat(80));

      // Análisis del JSON antes de parsear
      console.log("🔍 ANÁLISIS DEL JSON:");
      console.log(
        `- Longitud del JSON limpio: ${cleanContent.length} caracteres`
      );

      // Detectar si está cortado
      if (isJSONTruncated(cleanContent)) {
        console.log("⚠️  ADVERTENCIA: JSON parece estar cortado");
        console.log("🔄 Intentando usar fallback local...");
        throw new Error("JSON truncado - usando fallback local");
      }

      // Mostrar la parte problemática del JSON si es muy largo
      if (cleanContent.length > 2000) {
        const problemStart = Math.max(0, 1000);
        const problemEnd = Math.min(cleanContent.length, 1200);
        console.log(`- Área central (${problemStart}-${problemEnd}):`);
        console.log(cleanContent.substring(problemStart, problemEnd));
      }
      console.log("=".repeat(80));

      // Intentar parsear la respuesta JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (parseError) {
        console.log("❌ ERROR PARSING JSON:");
        console.log(`- Error: ${parseError.message}`);
        console.log(
          `- Posición: ${
            parseError.message.match(/position (\d+)/)?.[1] || "desconocida"
          }`
        );

        // Intentar reparar el JSON
        console.log("🔧 INTENTANDO REPARAR JSON...");
        const repairedContent = tryRepairJSON(cleanContent);
        if (repairedContent) {
          console.log("✅ JSON REPARADO:");
          console.log(repairedContent);
          parsed = JSON.parse(repairedContent);
        } else {
          throw parseError;
        }
      }

      console.log("📊 RESPUESTA PARSEADA:");
      console.log(JSON.stringify(parsed, null, 2));
      console.log("=".repeat(80));

      // Validar estructura básica
      if (
        parsed.te_podrian_gustar &&
        parsed.descubri_nuevas_lecturas &&
        Array.isArray(parsed.te_podrian_gustar) &&
        Array.isArray(parsed.descubri_nuevas_lecturas)
      ) {
        console.log("✅ RESPUESTA VÁLIDA - Estructura correcta");
        console.log(
          `📚 te_podrian_gustar: ${parsed.te_podrian_gustar.length} libros`
        );
        console.log(
          `📚 descubri_nuevas_lecturas: ${parsed.descubri_nuevas_lecturas.length} libros`
        );
        console.log("=".repeat(80));
        return parsed;
      } else {
        console.log("❌ RESPUESTA INVÁLIDA - Estructura incorrecta");
        console.log("=".repeat(80));
      }
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
    }

    // Si falla, intentar una vez más con prompt de corrección
    return await retryLLMWithCorrection(signals);
  } catch (error) {
    console.error("Error calling LLM:", error);
    return null;
  }
};

/**
 * Reintenta con un prompt de corrección si falla la primera vez
 */
const retryLLMWithCorrection = async (signals) => {
  try {
    const correctionPrompt = buildLLMPrompt(signals, true);

    // Log detallado del prompt de corrección
    console.log("=".repeat(80));
    console.log("🔄 REINTENTANDO CON CHATGPT (CORRECCIÓN)");
    console.log("=".repeat(80));
    console.log("📝 SYSTEM PROMPT (CORRECCIÓN):");
    console.log(correctionPrompt.system);
    console.log("\n📝 USER PROMPT (CORRECCIÓN):");
    console.log(correctionPrompt.user);
    console.log("=".repeat(80));

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: correctionPrompt.system,
          },
          {
            role: "user",
            content: correctionPrompt.user,
          },
        ],
        max_tokens: 2000,
        temperature: 0.5,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 60000, // 60 segundos - más tiempo para respuestas complejas
      }
    );

    const content = response.data.choices[0].message.content;

    // Log detallado de la respuesta de corrección
    console.log("=".repeat(80));
    console.log("🔄 RESPUESTA DE CHATGPT (CORRECCIÓN)");
    console.log("=".repeat(80));
    console.log("📄 RESPUESTA RAW (CORRECCIÓN):");
    console.log(content);
    console.log("=".repeat(80));

    // Análisis detallado del contenido
    console.log("🔍 ANÁLISIS DETALLADO:");
    console.log(`- Longitud total: ${content.length} caracteres`);
    console.log(`- Primeros 200 caracteres: ${content.substring(0, 200)}`);
    console.log(
      `- Últimos 200 caracteres: ${content.substring(
        Math.max(0, content.length - 200)
      )}`
    );
    console.log(`- Contiene { al inicio: ${content.trim().startsWith("{")}`);
    console.log(`- Contiene } al final: ${content.trim().endsWith("}")}`);
    console.log("=".repeat(80));

    try {
      // Limpiar la respuesta antes de parsear
      let cleanContent = content.trim();

      // Buscar el JSON válido en la respuesta
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      console.log("🧹 CONTENIDO LIMPIO (CORRECCIÓN):");
      console.log(cleanContent);
      console.log("=".repeat(80));

      // Análisis del JSON antes de parsear
      console.log("🔍 ANÁLISIS DEL JSON:");
      console.log(
        `- Longitud del JSON limpio: ${cleanContent.length} caracteres`
      );
      console.log(`- Posición del error: 2473 (línea 23, columna 114)`);

      // Mostrar la parte problemática del JSON
      const problemStart = Math.max(0, 2400);
      const problemEnd = Math.min(cleanContent.length, 2500);
      console.log(`- Área problemática (${problemStart}-${problemEnd}):`);
      console.log(cleanContent.substring(problemStart, problemEnd));
      console.log("=".repeat(80));

      // Intentar parsear la respuesta JSON
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (parseError) {
        console.log("❌ ERROR PARSING JSON (CORRECCIÓN):");
        console.log(`- Error: ${parseError.message}`);
        console.log(
          `- Posición: ${
            parseError.message.match(/position (\d+)/)?.[1] || "desconocida"
          }`
        );

        // Intentar reparar el JSON
        console.log("🔧 INTENTANDO REPARAR JSON (CORRECCIÓN)...");
        const repairedContent = tryRepairJSON(cleanContent);
        if (repairedContent) {
          console.log("✅ JSON REPARADO (CORRECCIÓN):");
          console.log(repairedContent);
          parsed = JSON.parse(repairedContent);
        } else {
          throw parseError;
        }
      }

      console.log("📊 RESPUESTA PARSEADA (CORRECCIÓN):");
      console.log(JSON.stringify(parsed, null, 2));
      console.log("=".repeat(80));

      if (
        parsed.te_podrian_gustar &&
        parsed.descubri_nuevas_lecturas &&
        Array.isArray(parsed.te_podrian_gustar) &&
        Array.isArray(parsed.descubri_nuevas_lecturas)
      ) {
        console.log("✅ CORRECCIÓN EXITOSA - Estructura correcta");
        console.log(
          `📚 te_podrian_gustar: ${parsed.te_podrian_gustar.length} libros`
        );
        console.log(
          `📚 descubri_nuevas_lecturas: ${parsed.descubri_nuevas_lecturas.length} libros`
        );
        console.log("=".repeat(80));
        return parsed;
      } else {
        console.log("❌ CORRECCIÓN FALLÓ - Estructura incorrecta");
        console.log("=".repeat(80));
      }
    } catch (parseError) {
      console.error("❌ ERROR PARSING CORRECCIÓN:", parseError);
      console.log("=".repeat(80));
    }
  } catch (error) {
    console.error("Error in LLM correction attempt:", error);
  }

  return null;
};

/**
 * Construye el prompt para ChatGPT
 */
const buildLLMPrompt = (signals, isCorrection = false) => {
  const systemPrompt = isCorrection
    ? `Sos un recomendador de libros **experto y creativo**. Debés devolver **JSON ESTRICTO** con recomendaciones de libros específicos (título + autor) que existan en Google Books.

IMPORTANTE: Tu respuesta anterior no fue válida. Ahora debés devolver EXACTAMENTE este formato JSON:
{
  "te_podrian_gustar": [
    { "titulo": "Título del Libro", "autor": "Nombre del Autor" },
    ... (exactamente 20 items)
  ],
  "descubri_nuevas_lecturas": [
    { "titulo": "Título del Libro", "autor": "Nombre del Autor" },
    ... (exactamente 20 items)
  ]
}

**REGLAS CRÍTICAS**:
- NO incluyas NINGÚN libro de la lista "YA LEÍDOS" que te proporcioné
- NO incluyas favoritos, likes, ni dislikes del usuario
- Libros reales de Google Books únicamente
- Exactamente 20 + 20 recomendaciones

NO agregues texto adicional, solo el JSON.`
    : `Sos un recomendador de libros **experto y creativo**. Tu misión es crear recomendaciones ÚNICAS y PERSONALIZADAS basándote en los gustos específicos del usuario.

**OBJETIVO ESPECÍFICO**:
- **Lista A "te_podrian_gustar"**: Libros SIMILARES a los favoritos y likes del usuario. Busca conexiones directas: mismo autor, género, tema, estilo, época. Deben ser "seguros" pero con variedad.
- **Lista B "descubri_nuevas_lecturas"**: Recomendaciones MÁS ATREVIDAS pero que puedan capturar al lector. Nuevos géneros, autores emergentes, clásicos olvidados, libros menos conocidos pero de calidad.

**ESTRATEGIA DE DIVERSIFICACIÓN**:
- **ANALIZA CADA FAVORITO INDIVIDUALMENTE**: Para cada favorito, identifica su género, autor, época, tema y busca 2-3 libros similares pero DIFERENTES
- **CONEXIONES ESPECÍFICAS**: Mismo autor (pero libros menos conocidos), mismo género (pero subgéneros diferentes), mismo tema (pero enfoques únicos)
- **DIVERSIDAD OBLIGATORIA**: No repitas autor en la misma lista, varía géneros, épocas, culturas, estilos narrativos
- **CREATIVIDAD PROFUNDA**: Busca libros que el usuario probablemente NO conozca pero que le gustarían
- **PERSONALIZACIÓN EXTREMA**: Cada recomendación debe tener una conexión clara y específica con los favoritos/likes

**TÉCNICAS DE DIVERSIFICACIÓN**:
- Si el favorito es un clásico → busca clásicos menos conocidos del mismo período
- Si el favorito es contemporáneo → busca autores emergentes del mismo género
- Si el favorito es de un autor específico → busca otros libros del autor o autores similares
- Si el favorito es de un género → explora subgéneros y variaciones del género
- Si el favorito es de una cultura → busca libros de culturas similares o contrastantes

**REGLAS ESTRICTAS**:
- **NO DUPLICADOS**: Cada libro debe ser único en ambas listas
- **NO LIBROS YA LEÍDOS**: No incluyas favoritos, likes, ni dislikes del usuario
- **EVITAR DISLIKES**: No recomendar similares a libros mal valorados
- **VARIEDAD TEMPORAL**: Incluye libros de diferentes épocas (clásicos, contemporáneos, recientes)
- **VARIEDAD CULTURAL**: Incluye autores de diferentes países y culturas
- **VARIEDAD DE GÉNEROS**: Si el usuario lee un género, explora subgéneros y géneros relacionados

Devolvé **únicamente** este JSON:
{
  "te_podrian_gustar": [
    { "titulo": "Título del Libro", "autor": "Nombre del Autor" },
    ... (exactamente 20 items)
  ],
  "descubri_nuevas_lecturas": [
    { "titulo": "Título del Libro", "autor": "Nombre del Autor" },
    ... (exactamente 20 items)
  ]
}`;

  const userPrompt = `**ANÁLISIS DETALLADO DEL USUARIO**:

LIBROS YA LEÍDOS POR EL USUARIO (NO RECOMENDAR NINGUNO DE ESTOS):

FAVORITOS (${signals.favoritos.length} libros ya leídos):
${signals.favoritos
  .map((f, i) => `${i + 1}. "${f.title}" por ${f.authors.join(", ")}`)
  .join("\n")}

LIKES (${signals.historialLikes.length} libros ya leídos - rating >= 3):
${signals.historialLikes.map((l, i) => `${i + 1}. "${l}"`).join("\n")}

DISLIKES (${signals.historialDislikes.length} libros ya leídos - rating <= 2):
${signals.historialDislikes.map((d, i) => `${i + 1}. "${d}"`).join("\n")}

**INSTRUCCIONES ESPECÍFICAS**:
1. **ANALIZA LOS GUSTOS**: Identifica género, autor, época, tema de los libros que le gustaron (favoritos + likes)
2. **Lista A "te_podrian_gustar"**: Busca libros SIMILARES a sus gustos pero NUEVOS (mismo autor pero menos conocidos, mismo género pero subgéneros, etc.)
3. **Lista B "descubri_nuevas_lecturas"**: Recomendaciones atrevidas basadas en sus gustos (nuevos géneros relacionados, autores emergentes, clásicos olvidados)
4. **DIVERSIFICA**: Varía épocas, culturas, estilos narrativos, subgéneros
5. **CONECTA**: Cada recomendación debe tener una conexión específica con sus gustos
6. **EXPLORA**: Busca libros que el usuario probablemente NO conozca pero que le gustarían

**REGLAS ESTRICTAS**:
- NO incluyas NINGÚN libro de la lista "YA LEÍDOS" de arriba
- NO incluyas favoritos, likes, ni dislikes
- Libros reales de Google Books
- NO DUPLICADOS: Cada libro único en ambas listas
- Exactamente 20 + 20 recomendaciones
- Conexiones específicas con sus gustos
- Máxima diversidad y creatividad`;

  return { system: systemPrompt, user: userPrompt };
};

// ═══════════════════════════════════════════════════════════════════════════
// SELECCIÓN Y PRIORIZACIÓN DE LIBROS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Selecciona los mejores libros de una lista, priorizando los que tienen imagen
 *
 * PRIORIDAD:
 *   1º: Libros con imagen real (no placeholder)
 *   2º: Libros sin imagen (solo si es necesario)
 *
 * MOTIVO: La experiencia visual es crucial para el usuario
 *         Es mejor mostrar 10 libros con portadas bonitas que 15 con placeholders
 */
const selectBestBooks = (books, maxCount = 10) => {
  if (books.length <= maxCount) {
    return books;
  }

  // Separar libros con y sin imagen
  const booksWithImage = books.filter(
    (book) => book.image && !book.image.includes("placehold.co")
  );
  const booksWithoutImage = books.filter(
    (book) => !book.image || book.image.includes("placehold.co")
  );

  console.log(
    `[Selection] Libros con imagen: ${booksWithImage.length}, sin imagen: ${booksWithoutImage.length}`
  );

  // Si hay suficientes libros con imagen, priorizar esos
  if (booksWithImage.length >= maxCount) {
    console.log(`[Selection] Priorizando ${maxCount} libros con imagen`);
    return booksWithImage.slice(0, maxCount);
  }

  // Si no hay suficientes con imagen, completar con los sin imagen
  const selectedBooks = [...booksWithImage];
  const remaining = maxCount - booksWithImage.length;

  if (remaining > 0) {
    selectedBooks.push(...booksWithoutImage.slice(0, remaining));
    console.log(
      `[Selection] Seleccionados: ${booksWithImage.length} con imagen + ${remaining} sin imagen`
    );
  }

  return selectedBooks;
};

// ═══════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO DE RECOMENDACIONES DE CHATGPT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convierte las recomendaciones de ChatGPT en libros completos con imágenes
 *
 * ENTRADA: 40 títulos de ChatGPT (solo título + autor)
 * PROCESO:
 *   1. Para cada título, busca en Google Books API (en paralelo)
 *   2. Obtiene imagen, descripción, categorías, etc.
 *   3. Filtra libros ya leídos o en favoritos
 *   4. Guarda cada libro en caché para futuras búsquedas
 *   5. Selecciona los 10 mejores de cada lista (priorizando imágenes)
 *
 * SALIDA: 20 libros completos (10 + 10) con toda la información
 *
 * PARALELIZACIÓN:
 * - Procesa 10 libros a la vez para velocidad
 * - Delays controlados para evitar rate limiting de Google Books
 * - Timeout de 5 segundos por libro para evitar cuelgues
 *
 * Este es el CORAZÓN del algoritmo - convierte nombres en libros reales
 */
const processLLMRecommendations = async (llmResponse, signals) => {
  console.log(
    `[Process] Procesando recomendaciones del LLM con paralelización controlada...`
  );
  console.log(`[Process] LLM Response:`, JSON.stringify(llmResponse, null, 2));

  // Inicio inmediato para máxima velocidad
  console.log(`[Process] Iniciando procesamiento inmediato...`);

  const tePodrianGustar = [];
  const descubriNuevasLecturas = [];
  const usedBookIds = new Set(); // Para evitar duplicados entre listas

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE PARALELIZACIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  // Estos valores están optimizados para balance entre velocidad y rate limiting
  const BATCH_SIZE = 10; // Procesar 10 libros simultáneamente
  const DELAY_BETWEEN_BOOKS = 50; // 50ms entre cada libro del batch (evita saturar API)
  const DELAY_BETWEEN_BATCHES = 200; // 200ms entre batches (da tiempo a Google Books)
  //
  // Ejemplo de timeline:
  //   0ms: Batch 1 (libros 1-10) en paralelo
  //   250ms: Batch 2 (libros 11-20) en paralelo
  //   500ms: ✅ Terminado "te_podrian_gustar"
  //   500ms: Batch 1 de "descubri_nuevas_lecturas"
  //   750ms: Batch 2 de "descubri_nuevas_lecturas"
  //   1000ms: ✅ TODO listo (vs 20 segundos si fuera secuencial)
  // ═══════════════════════════════════════════════════════════════════════════

  // ───────────────────────────────────────────────────────────────────────────
  // FUNCIÓN INTERNA: processBatch
  // Procesa un grupo de libros EN PARALELO para máxima velocidad
  // ───────────────────────────────────────────────────────────────────────────
  const processBatch = async (items, listName) => {
    const results = [];
    console.log(
      `[Process] Procesando batch de ${items.length} libros para "${listName}"`
    );

    // Dividir en grupos de 10 libros (BATCH_SIZE)
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      console.log(
        `[Process] Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${
          batch.length
        } libros`
      );

      // PROCESAMIENTO PARALELO: Busca los 10 libros del batch SIMULTÁNEAMENTE
      const batchPromises = batch.map(async (item, index) => {
        // Delay escalonado: libro 1 empieza ya, libro 2 espera 50ms, libro 3 espera 100ms, etc.
        // Esto evita saturar Google Books API con 10 requests al mismo instante
        await new Promise((resolve) =>
          setTimeout(resolve, index * DELAY_BETWEEN_BOOKS)
        );

        console.log(`[Process] Buscando: "${item.titulo}" por "${item.autor}"`);

        // TIMEOUT: Si Google Books tarda más de 5 segundos, cancelar y continuar
        const bookPromise = searchSpecificBook(item.titulo, item.autor);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const book = await Promise.race([bookPromise, timeoutPromise]).catch(
          (error) => {
            console.log(
              `[Process] ⚠️ Timeout o error para "${item.titulo}": ${error.message}`
            );
            return null;
          }
        );

        if (book) {
          // CACHÉ: Guardar este libro para futuras búsquedas del usuario
          // Si el usuario busca "El Alquimista" luego, le mostramos esta MISMA versión
          const { saveRecommendedVersion } = require("./recommendationCache");
          saveRecommendedVersion(item.titulo, item.autor, book);

          // FILTRO (CAPA 1): Verificar que el usuario NO haya leído este libro
          // Este es el primer nivel de seguridad contra libros ya leídos
          if (
            !signals.historialCompleto.includes(book.volumeId) &&
            !signals.favoritos.some((fav) => fav.volumeId === book.volumeId)
          ) {
            // ✅ Libro válido: No está leído ni en favoritos
            const bookData = {
              volumeId: book.volumeId,
              title: book.title,
              authors: book.authors,
              categories: book.categories,
              description: book.description,
              language: book.language,
              pageCount: book.pageCount,
              averageRating: book.averageRating,
              image: book.image,
              reason: "Recomendado por IA",
            };
            usedBookIds.add(book.volumeId);
            console.log(`[Process] ✅ Agregado a ${listName}: ${book.title}`);
            return bookData;
          } else {
            // ❌ Libro inválido: Usuario ya lo leyó o está en favoritos
            // Lo descartamos para no mostrar libros repetidos
            const reason = signals.historialCompleto.includes(book.volumeId)
              ? "ya leído"
              : signals.favoritos.some((fav) => fav.volumeId === book.volumeId)
              ? "favorito"
              : usedBookIds.has(book.volumeId)
              ? "duplicado"
              : "otro";
            console.log(`[Process] ❌ Excluido (${reason}): ${book.title}`);
            return null;
          }
        }
        return null;
      });

      // Esperar a que TODOS los libros del batch terminen (Promise.all)
      const batchResults = await Promise.all(batchPromises);

      // Agregar solo los libros válidos (filter elimina los null)
      results.push(...batchResults.filter((book) => book !== null));

      // Delay entre batches para no saturar Google Books API
      // (excepto en el último batch)
      if (i + BATCH_SIZE < items.length) {
        console.log(
          `[Process] Esperando ${DELAY_BETWEEN_BATCHES}ms antes del siguiente batch...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES)
        );
      }
    }

    return results;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Procesar AMBAS listas de recomendaciones de ChatGPT
  // ───────────────────────────────────────────────────────────────────────────

  // Lista 1: "Te podrían gustar" (20 títulos de ChatGPT)
  console.log(
    `[Process] Iniciando búsqueda paralela de ${llmResponse.te_podrian_gustar.length} libros para "te_podrian_gustar"...`
  );
  const tePodrianGustarResults = await processBatch(
    llmResponse.te_podrian_gustar,
    "te_podrian_gustar"
  );
  tePodrianGustar.push(...tePodrianGustarResults);

  // Lista 2: "Descubrí nuevas lecturas" (20 títulos de ChatGPT)
  console.log(
    `[Process] Iniciando búsqueda paralela de ${llmResponse.descubri_nuevas_lecturas.length} libros para "descubri_nuevas_lecturas"...`
  );
  const descubriNuevasLecturasResults = await processBatch(
    llmResponse.descubri_nuevas_lecturas,
    "descubri_nuevas_lecturas"
  );
  descubriNuevasLecturas.push(...descubriNuevasLecturasResults);

  console.log(
    `[Process] Resultado inicial: te_podrian_gustar=${tePodrianGustar.length}, descubri_nuevas_lecturas=${descubriNuevasLecturas.length}`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Seleccionar los 10 MEJORES libros de cada lista
  // Prioriza libros con imagen real sobre libros con placeholder
  // ───────────────────────────────────────────────────────────────────────────
  let selectedTePodrianGustar = selectBestBooks(tePodrianGustar, 10);
  let selectedDescubriNuevasLecturas = selectBestBooks(
    descubriNuevasLecturas,
    10
  );

  console.log(
    `[Process] Selección inicial: te_podrian_gustar=${selectedTePodrianGustar.length}, descubri_nuevas_lecturas=${selectedDescubriNuevasLecturas.length}`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SISTEMA DE RESPALDO NIVEL 1: Asegurar mínimo 8 libros por lista
  // ───────────────────────────────────────────────────────────────────────────
  // Si alguna lista tiene menos de 8 libros, completa con libros de la otra
  if (
    selectedTePodrianGustar.length < 8 ||
    selectedDescubriNuevasLecturas.length < 8
  ) {
    console.log(`[Backup] Activando sistema de respaldo mejorado...`);

    // Combinar todas las recomendaciones exitosas sin duplicados
    const allSuccessfulBooks = [...tePodrianGustar, ...descubriNuevasLecturas];
    const uniqueBooks = allSuccessfulBooks.filter(
      (book, index, arr) =>
        arr.findIndex((b) => b.volumeId === book.volumeId) === index
    );

    console.log(`[Backup] Libros únicos disponibles: ${uniqueBooks.length}`);

    // Si faltan libros en te_podrian_gustar
    if (selectedTePodrianGustar.length < 8) {
      const needed = 8 - selectedTePodrianGustar.length;
      const availableForBackup = uniqueBooks.filter(
        (book) =>
          !selectedTePodrianGustar.some(
            (selected) => selected.volumeId === book.volumeId
          )
      );

      const backupBooks = availableForBackup.slice(0, needed);
      selectedTePodrianGustar = [...selectedTePodrianGustar, ...backupBooks];
      console.log(
        `[Backup] Completando te_podrian_gustar con ${backupBooks.length} libros de respaldo`
      );
    }

    // Si faltan libros en descubri_nuevas_lecturas
    if (selectedDescubriNuevasLecturas.length < 8) {
      const needed = 8 - selectedDescubriNuevasLecturas.length;
      const availableForBackup = uniqueBooks.filter(
        (book) =>
          !selectedDescubriNuevasLecturas.some(
            (selected) => selected.volumeId === book.volumeId
          )
      );

      const backupBooks = availableForBackup.slice(0, needed);
      selectedDescubriNuevasLecturas = [
        ...selectedDescubriNuevasLecturas,
        ...backupBooks,
      ];
      console.log(
        `[Backup] Completando descubri_nuevas_lecturas con ${backupBooks.length} libros de respaldo`
      );
    }
  }

  console.log(
    `[Process] Selección final con respaldo: te_podrian_gustar=${selectedTePodrianGustar.length}, descubri_nuevas_lecturas=${selectedDescubriNuevasLecturas.length}`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // FALLBACK ABSOLUTO: Si TODO falló (0 libros encontrados)
  // ───────────────────────────────────────────────────────────────────────────
  // Solo se activa si ChatGPT recomendó libros pero NINGUNO se encontró en Google Books
  // o todos fueron descartados por estar ya leídos
  if (
    selectedTePodrianGustar.length === 0 &&
    selectedDescubriNuevasLecturas.length === 0
  ) {
    console.log(`[Fallback] ChatGPT falló completamente, usando defaults`);
    const defaults = getDefaultRecommendations();

    return {
      tePodrianGustar: defaults.tePodrianGustar.slice(0, 10),
      descubriNuevasLecturas: defaults.descubriNuevasLecturas.slice(0, 10),
    };
  }

  console.log(
    `[Process] Resultado final: tePodrianGustar=${selectedTePodrianGustar.length}, descubriNuevasLecturas=${selectedDescubriNuevasLecturas.length}`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // ESTADÍSTICAS (para debugging y monitoreo)
  // ───────────────────────────────────────────────────────────────────────────
  console.log(`[Process] 📊 ESTADÍSTICAS DE FILTRADO:`);
  console.log(
    `- Libros procesados por ChatGPT: ${
      llmResponse.te_podrian_gustar.length +
      llmResponse.descubri_nuevas_lecturas.length
    }`
  );
  console.log(
    `- Libros encontrados en Google Books: ${
      tePodrianGustar.length + descubriNuevasLecturas.length
    }`
  );
  console.log(
    `- Libros seleccionados finales: ${
      selectedTePodrianGustar.length + selectedDescubriNuevasLecturas.length
    }`
  );
  console.log(
    `- Tasa de éxito: ${(
      ((selectedTePodrianGustar.length +
        selectedDescubriNuevasLecturas.length) /
        (llmResponse.te_podrian_gustar.length +
          llmResponse.descubri_nuevas_lecturas.length)) *
      100
    ).toFixed(1)}%`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SISTEMA DE RESPALDO NIVEL 2: Completar hasta 10 libros por lista
  // ───────────────────────────────────────────────────────────────────────────
  // Si alguna lista tiene menos de 10, completa con libros de la otra lista
  const finalResult = await completePartialLists(
    selectedTePodrianGustar,
    selectedDescubriNuevasLecturas,
    signals
  );

  return finalResult;
};

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE RESPALDO PARA LISTAS INCOMPLETAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Completa listas que tienen menos de 10 libros tomando de la otra lista
 *
 * PROBLEMA QUE RESUELVE:
 *   Si ChatGPT recomienda 20 libros pero solo 7 se encuentran en Google Books,
 *   este método completa hasta 10 tomando libros de la otra lista.
 *
 * EJEMPLO:
 *   - "te_podrian_gustar": 7 libros (necesita 3 más)
 *   - "descubri_nuevas_lecturas": 12 libros
 *   → Toma 3 de "descubri_nuevas_lecturas" para completar "te_podrian_gustar"
 *   → Resultado: 10 + 10 libros
 *
 * IMPORTANTE: Solo completa con libros VÁLIDOS (ya filtrados previamente)
 */
const completePartialLists = async (
  tePodrianGustar,
  descubriNuevasLecturas,
  signals
) => {
  const TARGET_COUNT = 10; // Meta: 10 libros por lista

  console.log(
    `[Complete] Verificando listas: tePodrianGustar=${tePodrianGustar.length}, descubriNuevasLecturas=${descubriNuevasLecturas.length}`
  );

  let finalTePodrianGustar = [...tePodrianGustar];
  let finalDescubriNuevasLecturas = [...descubriNuevasLecturas];

  // Si alguna lista tiene menos de 10 libros, completar
  if (
    finalTePodrianGustar.length < TARGET_COUNT ||
    finalDescubriNuevasLecturas.length < TARGET_COUNT
  ) {
    console.log(`[Complete] Completando listas parciales...`);

    // Obtener libros por defecto como fuente de respaldo
    const defaults = getDefaultRecommendations();

    // Completar tePodrianGustar si es necesario
    if (finalTePodrianGustar.length < TARGET_COUNT) {
      const needed = TARGET_COUNT - finalTePodrianGustar.length;
      console.log(
        `[Complete] Necesitamos ${needed} libros más para tePodrianGustar`
      );

      // Primero intentar con libros de descubriNuevasLecturas que no estén duplicados
      const availableFromOther = finalDescubriNuevasLecturas
        .filter(
          (book) =>
            !finalTePodrianGustar.some(
              (existing) => existing.volumeId === book.volumeId
            )
        )
        .slice(0, needed);

      finalTePodrianGustar.push(...availableFromOther);

      // Si aún faltan, no usar defaults - solo completar con lo que tenemos
      const stillNeeded = TARGET_COUNT - finalTePodrianGustar.length;
      if (stillNeeded > 0) {
        console.log(
          `[Complete] Aún faltan ${stillNeeded} libros para tePodrianGustar, pero no usando defaults`
        );
      }
    }

    // Completar descubriNuevasLecturas si es necesario
    if (finalDescubriNuevasLecturas.length < TARGET_COUNT) {
      const needed = TARGET_COUNT - finalDescubriNuevasLecturas.length;
      console.log(
        `[Complete] Necesitamos ${needed} libros más para descubriNuevasLecturas`
      );

      // Primero intentar con libros de tePodrianGustar que no estén duplicados
      const availableFromOther = finalTePodrianGustar
        .filter(
          (book) =>
            !finalDescubriNuevasLecturas.some(
              (existing) => existing.volumeId === book.volumeId
            )
        )
        .slice(0, needed);

      finalDescubriNuevasLecturas.push(...availableFromOther);

      // Si aún faltan, no usar defaults - solo completar con lo que tenemos
      const stillNeeded = TARGET_COUNT - finalDescubriNuevasLecturas.length;
      if (stillNeeded > 0) {
        console.log(
          `[Complete] Aún faltan ${stillNeeded} libros para descubriNuevasLecturas, pero no usando defaults`
        );
      }
    }
  }

  console.log(
    `[Complete] Listas finales: tePodrianGustar=${finalTePodrianGustar.length}, descubriNuevasLecturas=${finalDescubriNuevasLecturas.length}`
  );

  return {
    tePodrianGustar: finalTePodrianGustar.slice(0, TARGET_COUNT),
    descubriNuevasLecturas: finalDescubriNuevasLecturas.slice(0, TARGET_COUNT),
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 FUNCIÓN PRINCIPAL - ORQUESTADOR DEL ALGORITMO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * FUNCIÓN PRINCIPAL: Obtiene recomendaciones personalizadas para el home
 *
 * ESTA ES LA FUNCIÓN QUE UNE TODO EL ALGORITMO
 *
 * FLUJO COMPLETO:
 *   1. ¿Hay caché? → SÍ → Retorna inmediatamente (sin llamar a APIs)
 *   2. ¿Hay caché? → NO → Continúa...
 *   3. Obtiene señales del usuario (favoritos, historial, likes, dislikes)
 *   4. ¿Usuario sin datos? → SÍ → Usa libros por defecto
 *   5. ¿Usuario con datos? → SÍ → Llama a ChatGPT
 *   6. ChatGPT devuelve 40 títulos
 *   7. Busca cada título en Google Books (en paralelo)
 *   8. Filtra libros ya leídos (CAPA 1)
 *   9. Elimina duplicados (CAPA 2)
 *   10. Valida y corrige libros inválidos (CAPA 3 - red de seguridad)
 *   11. Guarda en caché para la próxima vez
 *   12. Retorna 10+10 libros completos con imágenes
 *
 * ESTRATEGIAS POSIBLES:
 *   - "llm+googlebooks": ChatGPT + Google Books (lo ideal)
 *   - "fallback-defaults": Libros predefinidos (si algo falla)
 *
 * GARANTÍA: SIEMPRE retorna recomendaciones, nunca falla completamente
 */
const getHomeRecommendations = async (userId) => {
  try {
    // ─────────────────────────────────────────────────────────────────────────
    // PASO 1: VERIFICAR CACHÉ (optimización de rendimiento)
    // ─────────────────────────────────────────────────────────────────────────
    // Si ya generamos recomendaciones para este usuario en esta sesión,
    // las retornamos inmediatamente sin llamar a ChatGPT ni Google Books
    const cacheKey = `home_recs_${userId}`;
    const cached = recommendationsCache.get(cacheKey);

    console.log(`[Cache] Verificando caché para usuario ${userId}`);
    console.log(
      `[Cache] Tamaño del caché: ${recommendationsCache.size} entradas`
    );
    console.log(
      `[Cache] Claves en caché: ${Array.from(recommendationsCache.keys())}`
    );
    console.log(`[Cache] Buscando clave: ${cacheKey}`);
    console.log(`[Cache] Timestamp actual: ${new Date().toISOString()}`);

    if (cached) {
      console.log(
        `[Cache] ✅ HIT para usuario ${userId}, usando cache existente`
      );
      console.log(
        `[Cache] Cache generado: ${new Date(cached.timestamp).toLocaleString()}`
      );
      console.log(`[Cache] Estrategia usada: ${cached.data.metadata.strategy}`);

      // Verificar integridad del caché
      console.log(`[Cache] Verificando integridad del caché...`);
      console.log(
        `[Cache] tePodrianGustar existe: ${!!cached.data.tePodrianGustar}`
      );
      console.log(
        `[Cache] descubriNuevasLecturas existe: ${!!cached.data
          .descubriNuevasLecturas}`
      );
      console.log(
        `[Cache] tePodrianGustar length: ${
          cached.data.tePodrianGustar?.length || 0
        }`
      );
      console.log(
        `[Cache] descubriNuevasLecturas length: ${
          cached.data.descubriNuevasLecturas?.length || 0
        }`
      );

      if (
        cached.data.tePodrianGustar &&
        cached.data.descubriNuevasLecturas &&
        cached.data.tePodrianGustar.length > 0 &&
        cached.data.descubriNuevasLecturas.length > 0
      ) {
        console.log(
          `[Cache] Caché válido: ${cached.data.tePodrianGustar.length} + ${cached.data.descubriNuevasLecturas.length} libros`
        );

        // Si el caché tiene más de 10 libros, tomar solo los primeros 10
        if (
          cached.data.tePodrianGustar.length > 10 ||
          cached.data.descubriNuevasLecturas.length > 10
        ) {
          console.log(`[Cache] Ajustando caché a 10+10 libros`);
          cached.data.tePodrianGustar = cached.data.tePodrianGustar.slice(
            0,
            10
          );
          cached.data.descubriNuevasLecturas =
            cached.data.descubriNuevasLecturas.slice(0, 10);
        }

        return cached.data;
      } else {
        console.log(`[Cache] ❌ Caché corrupto, regenerando...`);
        console.log(
          `[Cache] Razón: tePodrianGustar=${
            cached.data.tePodrianGustar?.length || 0
          }, descubriNuevasLecturas=${
            cached.data.descubriNuevasLecturas?.length || 0
          }`
        );
        recommendationsCache.delete(cacheKey);
      }
    } else {
      console.log(`[Cache] ❌ No hay caché para usuario ${userId}`);
    }

    console.log(
      `[Cache] Miss para usuario ${userId}, generando nuevas recomendaciones`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // PASO 2: OBTENER SEÑALES DEL USUARIO
    // ─────────────────────────────────────────────────────────────────────────
    // Obtenemos favoritos, historial de lecturas, likes y dislikes
    // para personalizar las recomendaciones
    const signals = await getUserSignals(userId);
    console.log(
      `[Recommendations] Usuario ${userId}: ${signals.favoritos.length} favoritos, ${signals.historialCompleto.length} lecturas`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // DECISIÓN: ¿Qué estrategia usar?
    // ─────────────────────────────────────────────────────────────────────────

    // CASO A: Usuario nuevo sin datos → Usar libros por defecto
    if (
      signals.favoritos.length === 0 &&
      signals.historialCompleto.length === 0
    ) {
      console.log("[Recommendations] Caso A: Sin datos, usando defaults");
      console.log(
        `[Recommendations] DEBUG - Favoritos: ${signals.favoritos.length}, Historial: ${signals.historialCompleto.length}`
      );
      console.log(
        `[Recommendations] DEBUG - Favoritos detalle:`,
        JSON.stringify(signals.favoritos, null, 2)
      );
      console.log(
        `[Recommendations] DEBUG - Historial detalle:`,
        signals.historialCompleto
      );
      const defaults = getDefaultRecommendations();
      const result = {
        ...defaults,
        metadata: {
          ...defaults.metadata,
          userId,
        },
      };

      // Cachear
      console.log(
        `[Cache] 💾 Guardando fallback local en caché para usuario ${userId}`
      );
      console.log(`[Cache] Estrategia: ${result.metadata.strategy}`);
      setCacheAndSave(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
      console.log(
        `[Cache] ✅ Caché guardado. Tamaño actual: ${recommendationsCache.size}`
      );
      return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CASO B: Usuario con datos → Usar ChatGPT + Google Books (INTELIGENTE)
    // ─────────────────────────────────────────────────────────────────────────
    // Este es el flujo principal y más sofisticado del algoritmo

    console.log(
      "[Recommendations] Usuario con datos, intentando con ChatGPT..."
    );
    const llmResponse = await callLLMForPicks(signals);

    if (llmResponse) {
      console.log(
        "[Recommendations] LLM exitoso, procesando recomendaciones..."
      );
      const { tePodrianGustar, descubriNuevasLecturas } =
        await processLLMRecommendations(llmResponse, signals);

      console.log(
        `[Recommendations] LLM devolvió: ${tePodrianGustar.length} + ${descubriNuevasLecturas.length} libros`
      );

      // ─────────────────────────────────────────────────────────────────────────
      // ChatGPT tuvo éxito - Procesar las recomendaciones
      // ─────────────────────────────────────────────────────────────────────────
      if (tePodrianGustar.length > 0 || descubriNuevasLecturas.length > 0) {
        console.log(
          `[Recommendations] LLM devolvió: ${tePodrianGustar.length} + ${descubriNuevasLecturas.length} libros`
        );
        console.log(
          "[Recommendations] Usando respuesta de ChatGPT (sin completar con defaults)"
        );

        let result = {
          tePodrianGustar: tePodrianGustar,
          descubriNuevasLecturas: descubriNuevasLecturas,
          metadata: {
            userId,
            generatedAt: new Date().toISOString(),
            strategy: "llm+googlebooks", // Estrategia exitosa: ChatGPT + Google Books
            shortlistSize: 0,
          },
        };

        // CAPA 2: Eliminar duplicados entre ambas listas
        result = removeDuplicates(result);

        // CAPA 3: Validación final y corrección de libros inválidos (red de seguridad)
        const correctedResult = await validateAndCorrectRecommendations(
          result,
          signals
        );
        if (correctedResult) {
          console.log(
            `[VALIDATION] ✅ Recomendaciones validadas y corregidas exitosamente`
          );
          result = correctedResult;

          // Guardar en caché para que persista durante toda la sesión
          console.log(`[Cache] 💾 Guardando en caché para usuario ${userId}`);
          console.log(`[Cache] Estrategia: ${result.metadata.strategy}`);
          setCacheAndSave(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
          console.log(
            `[Cache] ✅ Caché guardado. Tamaño actual: ${recommendationsCache.size}`
          );
          return result;
        }
      }

      // ChatGPT no devolvió ningún libro válido
      console.log(
        `[LLM] No devolvió recomendaciones: tePodrianGustar=${tePodrianGustar.length}, descubriNuevasLecturas=${descubriNuevasLecturas.length}`
      );
      console.log("[LLM] Usando fallback a defaults");
    } else {
      console.log(
        "[Recommendations] LLM falló o no respondió, usando fallback"
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FALLBACK FINAL: Usar libros por defecto cuando ChatGPT falla
    // ─────────────────────────────────────────────────────────────────────────
    // Se activa cuando:
    // - ChatGPT no responde (timeout, error de API, etc.)
    // - ChatGPT responde pero el JSON es inválido
    // - Ningún libro de ChatGPT se encuentra en Google Books
    console.log(
      "[Recommendations] Activando fallback: usando libros por defecto predefinidos"
    );
    const defaults = getDefaultRecommendations();
    const result = {
      ...defaults,
      metadata: {
        ...defaults.metadata,
        userId,
        strategy: "fallback-defaults", // Indica que se usó el fallback
      },
    };

    // Guardar en caché el fallback (para no intentar ChatGPT en cada reload)
    console.log(
      `[Cache] 💾 Guardando fallback en caché para usuario ${userId}`
    );
    console.log(`[Cache] Estrategia: ${result.metadata.strategy}`);
    setCacheAndSave(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });
    console.log(
      `[Cache] ✅ Caché guardado. Tamaño actual: ${recommendationsCache.size}`
    );
    return result;
  } catch (error) {
    console.error("Error getting home recommendations:", error);
    console.log(
      "[Recommendations] Error crítico, usando defaults como último recurso"
    );
    const defaults = getDefaultRecommendations();
    const result = {
      ...defaults,
      metadata: {
        ...defaults.metadata,
        userId,
        strategy: "fallback-defaults",
      },
    };
    console.log(
      "[Recommendations] Recomendaciones generadas con estrategia: fallback-defaults"
    );
    return result;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDACIÓN Y CORRECCIÓN DE RECOMENDACIONES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CAPA 2: Elimina duplicados entre ambas listas
 *
 * Asegura que un mismo libro no aparezca en ambas listas
 * (te_podrian_gustar Y descubri_nuevas_lecturas)
 */
const removeDuplicates = (result) => {
  const seenIds = new Set();

  // Filtrar tePodrianGustar
  result.tePodrianGustar = result.tePodrianGustar.filter((book) => {
    if (seenIds.has(book.volumeId)) {
      return false;
    }
    seenIds.add(book.volumeId);
    return true;
  });

  // Filtrar descubriNuevasLecturas
  result.descubriNuevasLecturas = result.descubriNuevasLecturas.filter(
    (book) => {
      if (seenIds.has(book.volumeId)) {
        return false;
      }
      seenIds.add(book.volumeId);
      return true;
    }
  );

  return result;
};

/**
 * CAPA 3 (ÚLTIMA RED DE SEGURIDAD): Valida y corrige libros inválidos
 *
 * PROBLEMA QUE RESUELVE:
 *   Por si acaso un libro ya leído/favorito se escapó del filtro en Capa 1,
 *   este método lo detecta y REEMPLAZA automáticamente.
 *
 * PROCESO:
 *   1. Revisa CADA libro de ambas listas
 *   2. Si encuentra uno ya leído o en favoritos → llama a findReplacementBook
 *   3. findReplacementBook busca un clásico popular que el usuario NO haya leído
 *   4. Reemplaza el libro inválido con el nuevo
 *
 * EJEMPLO:
 *   - Detecta: "El Alquimista" (usuario ya lo leyó)
 *   - Llama: findReplacementBook()
 *   - Encuentra: "1984" (usuario no lo leyó)
 *   - Reemplaza: "El Alquimista" → "1984"
 *
 * Esta es una medida de ÚLTIMO RECURSO - 99% del tiempo no hace nada
 * porque la Capa 1 ya filtró todo correctamente.
 */
const validateAndCorrectRecommendations = async (result, signals) => {
  const historialIds = new Set(signals.historialCompleto);
  const favoritoIds = new Set(signals.favoritos.map((fav) => fav.volumeId));
  let hasInvalidBooks = false;

  // Revisar y corregir "te_podrian_gustar"
  for (let i = 0; i < result.tePodrianGustar.length; i++) {
    const book = result.tePodrianGustar[i];
    if (historialIds.has(book.volumeId) || favoritoIds.has(book.volumeId)) {
      console.log(
        `[Validation] ❌ ALERTA: Libro inválido detectado en tePodrianGustar: ${book.title}`
      );

      // Buscar un libro de reemplazo de la lista de clásicos
      const replacementBook = await findReplacementBook(
        signals,
        result.tePodrianGustar
      );
      if (replacementBook) {
        result.tePodrianGustar[i] = replacementBook;
        console.log(
          `[Validation] ✅ Reemplazado con: ${replacementBook.title}`
        );
        hasInvalidBooks = true;
      } else {
        console.log(
          `[Validation] ❌ No se pudo encontrar reemplazo para: ${book.title}`
        );
        return null;
      }
    }
  }

  // Corregir descubriNuevasLecturas
  for (let i = 0; i < result.descubriNuevasLecturas.length; i++) {
    const book = result.descubriNuevasLecturas[i];
    if (historialIds.has(book.volumeId) || favoritoIds.has(book.volumeId)) {
      console.log(
        `[Validation] ❌ Reemplazando libro inválido en descubriNuevasLecturas: ${book.title}`
      );

      // Buscar un libro de reemplazo
      const replacementBook = await findReplacementBook(
        signals,
        result.descubriNuevasLecturas
      );
      if (replacementBook) {
        result.descubriNuevasLecturas[i] = replacementBook;
        console.log(
          `[Validation] ✅ Reemplazado con: ${replacementBook.title}`
        );
        hasInvalidBooks = true;
      } else {
        console.log(
          `[Validation] ❌ No se pudo encontrar reemplazo para: ${book.title}`
        );
        return null;
      }
    }
  }

  if (hasInvalidBooks) {
    console.log(`[Validation] ✅ Se corrigieron libros inválidos exitosamente`);
  }

  return result;
};

/**
 * Busca un libro de reemplazo de emergencia cuando se detecta uno inválido
 *
 * CÓMO FUNCIONA:
 *   1. Tiene una lista HARDCODEADA de 10 clásicos populares (solo título + autor)
 *   2. Para cada clásico, busca su info completa en Google Books API
 *   3. Verifica que el usuario NO lo haya leído ni esté en favoritos
 *   4. Retorna el PRIMER libro válido que encuentre
 *
 * LISTA HARDCODEADA:
 *   Solo guarda título + autor (no imágenes, para no quedar desactualizado)
 *   Las imágenes y descripciones se obtienen en tiempo real de Google Books
 *
 * USO:
 *   Este método solo se llama cuando validateAndCorrectRecommendations
 *   detecta un libro inválido que se escapó del filtro inicial.
 *   Es una medida de EMERGENCIA - raramente se ejecuta.
 */
const findReplacementBook = async (signals, existingBooks) => {
  const historialIds = new Set(signals.historialCompleto);
  const favoritoIds = new Set(signals.favoritos.map((fav) => fav.volumeId));
  const existingIds = new Set(existingBooks.map((book) => book.volumeId));

  // ─────────────────────────────────────────────────────────────────────────
  // Lista de clásicos populares para usar como reemplazo de emergencia
  // Solo guardamos título + autor (lo mínimo)
  // La info completa (imagen, descripción) se obtiene de Google Books
  // ─────────────────────────────────────────────────────────────────────────
  const replacementBooks = [
    { title: "1984", author: "George Orwell" },
    { title: "El Gran Gatsby", author: "F. Scott Fitzgerald" },
    { title: "Matar a un ruiseñor", author: "Harper Lee" },
    { title: "El señor de los anillos", author: "J.R.R. Tolkien" },
    { title: "Orgullo y prejuicio", author: "Jane Austen" },
    { title: "Cien años de soledad", author: "Gabriel García Márquez" },
    { title: "El hobbit", author: "J.R.R. Tolkien" },
    { title: "Fahrenheit 451", author: "Ray Bradbury" },
    { title: "Don Quijote de la Mancha", author: "Miguel de Cervantes" },
    { title: "Los miserables", author: "Victor Hugo" },
  ];

  // Buscar el primer libro válido de la lista
  for (const book of replacementBooks) {
    try {
      // Buscar en Google Books API para obtener info completa (imagen, descripción, etc.)
      const foundBook = await searchSpecificBook(book.title, book.author);
      if (
        foundBook &&
        !historialIds.has(foundBook.volumeId) &&
        !favoritoIds.has(foundBook.volumeId) &&
        !existingIds.has(foundBook.volumeId)
      ) {
        return {
          ...foundBook,
          reason: "Reemplazo por libro inválido",
        };
      }
    } catch (error) {
      console.log(`[Replacement] Error buscando ${book.title}:`, error.message);
    }
  }

  return null;
};

module.exports = {
  getHomeRecommendations,
  clearUserCache,
};
