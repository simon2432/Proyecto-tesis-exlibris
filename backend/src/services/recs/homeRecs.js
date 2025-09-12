const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { getDefaultRecommendations } = require("./homeDefaults");

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
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Cache persistente por sesión (solo se invalida al relogear)
const recommendationsCache = new Map();
const CACHE_DURATION = Infinity; // Caché permanente hasta invalidación explícita

// Cache de timestamps para debugging
const cacheTimestamps = new Map();

/**
 * Detecta si una respuesta JSON está cortada
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
 * Intenta reparar un JSON mal formateado
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

/**
 * Busca información de un libro en Google Books API
 */
const searchBookInfo = async (volumeId) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${volumeId}?key=${GOOGLE_BOOKS_API_KEY}`
    );

    if (response.data && response.data.volumeInfo) {
      const info = response.data.volumeInfo;
      return {
        title: info.title || `Libro ${volumeId}`,
        authors: info.authors || [],
        categories: info.categories || [],
      };
    }
  } catch (error) {
    console.error(
      `[Signals] Error buscando libro ${volumeId} en Google Books:`,
      error.message
    );
  }

  return {
    title: `Libro ${volumeId}`,
    authors: [],
    categories: [],
  };
};

/**
 * Obtiene las señales del usuario (favoritos, historial, likes/dislikes)
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

/**
 * Busca candidatos en Google Books basándose en las señales del usuario
 */
const fetchShortlistFromGoogleBooks = async (signals) => {
  if (!GOOGLE_BOOKS_API_KEY) {
    console.warn("Google Books API key no configurada");
    return [];
  }

  try {
    const shortlist = [];
    const seenIds = new Set();

    // Combinar favoritos y likes para generar queries
    const positiveSignals = [...signals.favoritos, ...signals.historialLikes];

    for (const signal of positiveSignals) {
      // Buscar por autor
      if (signal.authors && signal.authors.length > 0) {
        for (const author of signal.authors.slice(0, 2)) {
          // Máximo 2 autores por libro
          const query = `inauthor:"${encodeURIComponent(author)}"`;
          const results = await searchGoogleBooks(query, 20);
          addToShortlist(
            results,
            shortlist,
            seenIds,
            signals.historialCompleto,
            signals.favoritos
          );
        }
      }

      // Buscar por categoría
      if (signal.categories && signal.categories.length > 0) {
        for (const category of signal.categories.slice(0, 2)) {
          // Máximo 2 categorías por libro
          const query = `subject:"${encodeURIComponent(category)}"`;
          const results = await searchGoogleBooks(query, 15);
          addToShortlist(
            results,
            shortlist,
            seenIds,
            signals.historialCompleto,
            signals.favoritos
          );
        }
      }

      // Buscar por palabras clave del título
      if (signal.title) {
        const keywords = signal.title
          .split(" ")
          .filter((word) => word.length > 3)
          .slice(0, 3);
        for (const keyword of keywords) {
          const query = `intitle:"${encodeURIComponent(keyword)}"`;
          const results = await searchGoogleBooks(query, 10);
          addToShortlist(
            results,
            shortlist,
            seenIds,
            signals.historialCompleto,
            signals.favoritos
          );
        }
      }
    }

    // Si no hay suficientes resultados, agregar búsquedas genéricas
    if (shortlist.length < 60) {
      const genericQueries = [
        'subject:"Fiction"',
        'subject:"Science Fiction"',
        'subject:"Fantasy"',
        'subject:"Mystery"',
        'subject:"Romance"',
      ];

      for (const query of genericQueries) {
        const results = await searchGoogleBooks(query, 10);
        addToShortlist(
          results,
          shortlist,
          seenIds,
          signals.historialCompleto,
          signals.favoritos
        );

        if (shortlist.length >= 120) break; // Límite máximo
      }
    }

    return shortlist.slice(0, 120); // Máximo 120 items
  } catch (error) {
    console.error("Error fetching shortlist from Google Books:", error);
    return [];
  }
};

/**
 * Busca libros en Google Books API
 */
const searchGoogleBooks = async (query, maxResults = 20) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=${maxResults}&key=${GOOGLE_BOOKS_API_KEY}`
    );

    if (!response.data.items) return [];

    return response.data.items
      .filter((item) => item.id && item.volumeInfo.title) // Validar que tenga id y título
      .map((item) => ({
        volumeId: item.id,
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
  } catch (error) {
    console.error(`Error searching Google Books with query "${query}":`, error);
    return [];
  }
};

/**
 * Busca un libro específico en Google Books por título (más eficiente)
 */
const searchSpecificBook = async (titulo, autor) => {
  try {
    // Usar búsqueda flexible como la barra de búsqueda
    let searchQuery;
    if (autor && autor.trim() !== "") {
      searchQuery = `${titulo} ${autor}`;
    } else {
      searchQuery = titulo;
    }

    const response = await axios.get(
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
        `[Search] Rate limit alcanzado para "${titulo}", esperando 5 segundos...`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
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

/**
 * Agrega resultados a la shortlist evitando duplicados y libros ya leídos
 */
const addToShortlist = (
  results,
  shortlist,
  seenIds,
  historialCompleto,
  favoritos
) => {
  for (const book of results) {
    // Verificar que el libro tenga un volumeId válido
    if (!book.volumeId || book.volumeId.trim() === "") continue;

    // Verificar que el libro no esté ya en la shortlist
    if (seenIds.has(book.volumeId)) continue;

    // Verificar que el libro no esté en el historial de lecturas (MÁS ESTRICTO)
    if (historialCompleto.includes(book.volumeId)) {
      console.log(
        `[Filter] Excluyendo libro del historial: ${book.volumeId} - ${book.title}`
      );
      continue;
    }

    // Verificar que el libro no esté en favoritos (MÁS ESTRICTO)
    if (favoritos.some((fav) => fav.volumeId === book.volumeId)) {
      console.log(
        `[Filter] Excluyendo libro de favoritos: ${book.volumeId} - ${book.title}`
      );
      continue;
    }

    // Verificar que no excedamos el límite
    if (shortlist.length >= 120) break;

    seenIds.add(book.volumeId);
    shortlist.push(book);
    console.log(
      `[Filter] Agregando libro válido: ${book.volumeId} - ${book.title}`
    );
  }
};

/**
 * Llama a ChatGPT para seleccionar los libros recomendados
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
        model: "gpt-3.5-turbo",
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
        max_tokens: 800,
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 30000, // 30 segundos
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
        model: "gpt-3.5-turbo",
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
        temperature: 0.1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 30000,
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
- **NO HISTORIAL**: No incluyas libros ya leídos por el usuario
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

FAVORITOS (${signals.favoritos.length} libros):
${signals.favoritos
  .map((f, i) => `${i + 1}. "${f.title}" por ${f.authors.join(", ")}`)
  .join("\n")}

LIKES (${signals.historialLikes.length} libros - rating >= 3):
${signals.historialLikes.map((l, i) => `${i + 1}. "${l}"`).join("\n")}

DISLIKES (${signals.historialDislikes.length} libros - rating <= 2):
${signals.historialDislikes.map((d, i) => `${i + 1}. "${d}"`).join("\n")}

**INSTRUCCIONES ESPECÍFICAS**:
1. **ANALIZA CADA FAVORITO**: Identifica género, autor, época, tema de cada favorito
2. **Lista A**: Para cada favorito, busca 2-3 libros similares pero DIFERENTES (mismo autor pero menos conocidos, mismo género pero subgéneros, etc.)
3. **Lista B**: Recomendaciones atrevidas basadas en los favoritos (nuevos géneros relacionados, autores emergentes, clásicos olvidados)
4. **DIVERSIFICA**: Varía épocas, culturas, estilos narrativos, subgéneros
5. **CONECTA**: Cada recomendación debe tener una conexión específica con los favoritos
6. **EXPLORA**: Busca libros que el usuario probablemente NO conozca pero que le gustarían

**REGLAS FINALES**:
- Libros reales de Google Books
- NO DUPLICADOS: Cada libro único
- Exactamente 20 + 20 recomendaciones
- Conexiones específicas con favoritos
- Máxima diversidad y creatividad`;

  return { system: systemPrompt, user: userPrompt };
};

/**
 * Valida y completa la respuesta del LLM con datos de la shortlist
 */
/**
 * Selecciona los mejores libros de una lista, priorizando los que tienen imagen
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

/**
 * Procesa las recomendaciones del LLM y busca cada libro en Google Books
 */
const processLLMRecommendations = async (llmResponse, signals) => {
  console.log(`[Process] Procesando recomendaciones del LLM...`);
  console.log(`[Process] LLM Response:`, JSON.stringify(llmResponse, null, 2));

  const tePodrianGustar = [];
  const descubriNuevasLecturas = [];

  // Procesar "te_podrian_gustar"
  console.log(
    `[Process] Buscando ${llmResponse.te_podrian_gustar.length} libros para "te_podrian_gustar"...`
  );
  for (const item of llmResponse.te_podrian_gustar) {
    console.log(`[Process] Buscando: "${item.titulo}" por "${item.autor}"`);
    const book = await searchSpecificBook(item.titulo, item.autor);

    // Delay de 2 segundos entre consultas para evitar rate limit (100 queries/min = 1.67s entre consultas)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (book) {
      // Guardar en cache para uso futuro en búsquedas
      const { saveRecommendedVersion } = require("./recommendationCache");
      saveRecommendedVersion(item.titulo, item.autor, book);

      // Verificar que no esté en historial o favoritos
      if (
        !signals.historialCompleto.includes(book.volumeId) &&
        !signals.favoritos.some((fav) => fav.volumeId === book.volumeId)
      ) {
        tePodrianGustar.push({
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
        });
        console.log(`[Process] ✅ Agregado a te_podrian_gustar: ${book.title}`);
      } else {
        console.log(`[Process] ❌ Excluido (ya leído/favorito): ${book.title}`);
      }
    }
  }

  // Procesar "descubri_nuevas_lecturas"
  console.log(
    `[Process] Buscando ${llmResponse.descubri_nuevas_lecturas.length} libros para "descubri_nuevas_lecturas"...`
  );
  for (const item of llmResponse.descubri_nuevas_lecturas) {
    console.log(`[Process] Buscando: "${item.titulo}" por "${item.autor}"`);
    const book = await searchSpecificBook(item.titulo, item.autor);

    // Delay de 2 segundos entre consultas para evitar rate limit (100 queries/min = 1.67s entre consultas)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if (book) {
      // Guardar en cache para uso futuro en búsquedas
      const { saveRecommendedVersion } = require("./recommendationCache");
      saveRecommendedVersion(item.titulo, item.autor, book);

      // Verificar que no esté en historial o favoritos
      if (
        !signals.historialCompleto.includes(book.volumeId) &&
        !signals.favoritos.some((fav) => fav.volumeId === book.volumeId)
      ) {
        descubriNuevasLecturas.push({
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
        });
        console.log(
          `[Process] ✅ Agregado a descubri_nuevas_lecturas: ${book.title}`
        );
      } else {
        console.log(`[Process] ❌ Excluido (ya leído/favorito): ${book.title}`);
      }
    }
  }

  console.log(
    `[Process] Resultado inicial: te_podrian_gustar=${tePodrianGustar.length}, descubri_nuevas_lecturas=${descubriNuevasLecturas.length}`
  );

  // Seleccionar los mejores 10 libros de cada lista, priorizando los que tienen imagen
  const selectedTePodrianGustar = selectBestBooks(tePodrianGustar, 10);
  const selectedDescubriNuevasLecturas = selectBestBooks(
    descubriNuevasLecturas,
    10
  );

  console.log(
    `[Process] Selección final: te_podrian_gustar=${selectedTePodrianGustar.length}, descubri_nuevas_lecturas=${selectedDescubriNuevasLecturas.length}`
  );

  // Si no tenemos suficientes libros, completar con defaults
  if (
    selectedTePodrianGustar.length < 10 ||
    selectedDescubriNuevasLecturas.length < 10
  ) {
    console.log(
      `[Process] Completando con defaults: tePodrianGustar=${selectedTePodrianGustar.length}, descubriNuevasLecturas=${selectedDescubriNuevasLecturas.length}`
    );
    const defaults = getDefaultRecommendations();

    // Completar tePodrianGustar
    while (selectedTePodrianGustar.length < 10) {
      const defaultBook =
        defaults.tePodrianGustar[
          selectedTePodrianGustar.length % defaults.tePodrianGustar.length
        ];
      selectedTePodrianGustar.push({
        ...defaultBook,
        reason: `Recomendación por defecto (${
          selectedTePodrianGustar.length + 1
        })`,
      });
    }

    // Completar descubriNuevasLecturas
    while (selectedDescubriNuevasLecturas.length < 10) {
      const defaultBook =
        defaults.descubriNuevasLecturas[
          selectedDescubriNuevasLecturas.length %
            defaults.descubriNuevasLecturas.length
        ];
      selectedDescubriNuevasLecturas.push({
        ...defaultBook,
        reason: `Recomendación por defecto (${
          selectedDescubriNuevasLecturas.length + 1
        })`,
      });
    }

    console.log(
      `[Process] Completado: tePodrianGustar=${selectedTePodrianGustar.length}, descubriNuevasLecturas=${selectedDescubriNuevasLecturas.length}`
    );
  }

  return {
    tePodrianGustar: selectedTePodrianGustar,
    descubriNuevasLecturas: selectedDescubriNuevasLecturas,
  };
};

/**
 * Fallback local usando scoring simple y MMR para diversidad
 */
const buildFallbackLocal = (shortlist, signals) => {
  console.log(
    `[Fallback] Iniciando con shortlist de ${shortlist.length} libros`
  );

  // Scoring simple basado en afinidad
  const scoredBooks = shortlist.map((book) => {
    let score = 0;

    // Puntos por autor similar
    for (const favorite of signals.favoritos) {
      if (
        favorite.authors.some((author) =>
          book.authors.some(
            (bookAuthor) =>
              bookAuthor.toLowerCase().includes(author.toLowerCase()) ||
              author.toLowerCase().includes(bookAuthor.toLowerCase())
          )
        )
      ) {
        score += 3;
      }
    }

    // Puntos por categoría similar
    for (const favorite of signals.favoritos) {
      if (
        favorite.categories.some((cat) =>
          book.categories.some(
            (bookCat) =>
              bookCat.toLowerCase().includes(cat.toLowerCase()) ||
              cat.toLowerCase().includes(bookCat.toLowerCase())
          )
        )
      ) {
        score += 2;
      }
    }

    // Penalizar si es similar a dislikes
    for (const dislike of signals.historialDislikes) {
      if (
        dislike.authors.some((author) =>
          book.authors.some(
            (bookAuthor) =>
              bookAuthor.toLowerCase().includes(author.toLowerCase()) ||
              author.toLowerCase().includes(bookAuthor.toLowerCase())
          )
        )
      ) {
        score -= 2;
      }
    }

    return { ...book, score };
  });

  // Ordenar por score
  scoredBooks.sort((a, b) => b.score - a.score);
  console.log(`[Fallback] Libros con scoring: ${scoredBooks.length}`);

  // Garantizar que tengamos suficientes libros para ambas listas
  if (scoredBooks.length < 24) {
    const needed = 24 - scoredBooks.length;
    console.log(
      `[Fallback] Necesitamos ${needed} libros más, duplicando con variaciones`
    );

    // Si no hay suficientes, duplicar algunos libros con diferentes razones
    for (let i = 0; i < needed; i++) {
      const book = scoredBooks[i % scoredBooks.length];
      scoredBooks.push({
        ...book,
        volumeId: `${book.volumeId}_${i}`,
        reason: `Alternativa ${i + 1} - ${
          book.reason || "Recomendación adicional"
        }`,
      });
    }
  }

  // Seleccionar top 10 para "te podrian gustar"
  const tePodrianGustar = scoredBooks.slice(0, 10).map((book) => ({
    volumeId: book.volumeId,
    title: book.title,
    authors: book.authors,
    categories: book.categories,
    description: book.description,
    language: book.language,
    pageCount: book.pageCount,
    averageRating: book.averageRating,
    image: book.image,
    reason: book.reason || `Recomendado por afinidad (score: ${book.score})`,
  }));

  console.log(`[Fallback] tePodrianGustar: ${tePodrianGustar.length} libros`);

  // MMR para "descubri nuevas lecturas" (diversidad)
  const descubriNuevasLecturas = [];
  const remainingBooks = scoredBooks.slice(10);

  console.log(`[Fallback] Libros restantes para MMR: ${remainingBooks.length}`);

  // Garantizar que tengamos exactamente 10 libros para la segunda lista
  let booksToSelect = 10;

  if (remainingBooks.length > 0) {
    descubriNuevasLecturas.push({
      volumeId: remainingBooks[0].volumeId,
      title: remainingBooks[0].title,
      authors: remainingBooks[0].authors,
      categories: remainingBooks[0].categories,
      reason: remainingBooks[0].reason || "Exploración de nuevos géneros",
    });
    booksToSelect--;

    // MMR con λ = 0.7
    const lambda = 0.7;
    const selectedIds = new Set([remainingBooks[0].volumeId]);

    for (let i = 1; i < booksToSelect && i < remainingBooks.length; i++) {
      let bestBook = remainingBooks[i];
      let bestScore = -1;

      for (let j = i; j < remainingBooks.length; j++) {
        const book = remainingBooks[j];
        if (selectedIds.has(book.volumeId)) continue;

        // Calcular diversidad con libros ya seleccionados
        let diversity = 0;
        for (const selectedId of selectedIds) {
          const selectedBook = remainingBooks.find(
            (b) => b.volumeId === selectedId
          );
          if (selectedBook) {
            // Penalizar por autor repetido
            if (
              book.authors.some((author) =>
                selectedBook.authors.some(
                  (selAuthor) =>
                    author.toLowerCase().includes(selAuthor.toLowerCase()) ||
                    selAuthor.toLowerCase().includes(author.toLowerCase())
                )
              )
            ) {
              diversity -= 1;
            }
            // Penalizar por categoría repetida
            if (
              book.categories.some((cat) =>
                selectedBook.categories.some(
                  (selCat) =>
                    cat.toLowerCase().includes(selCat.toLowerCase()) ||
                    selCat.toLowerCase().includes(cat.toLowerCase())
                )
              )
            ) {
              diversity -= 0.5;
            }
          }
        }

        const mmrScore = lambda * book.score + (1 - lambda) * diversity;
        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestBook = book;
        }
      }

      if (bestBook) {
        descubriNuevasLecturas.push({
          volumeId: bestBook.volumeId,
          title: bestBook.title,
          authors: bestBook.authors,
          categories: bestBook.categories,
          description: bestBook.description,
          language: bestBook.language,
          pageCount: bestBook.pageCount,
          averageRating: bestBook.averageRating,
          image: bestBook.image,
          reason: bestBook.reason || "Diversificación de lecturas",
        });
        selectedIds.add(bestBook.volumeId);
      }
    }
  }

  console.log(
    `[Fallback] descubriNuevasLecturas antes de completar: ${descubriNuevasLecturas.length} libros`
  );

  // Si aún no tenemos 10 libros, completar con los que falten
  while (descubriNuevasLecturas.length < 10) {
    const remainingIndex = descubriNuevasLecturas.length + 9;
    if (remainingIndex < scoredBooks.length) {
      const book = scoredBooks[remainingIndex];
      descubriNuevasLecturas.push({
        volumeId: book.volumeId,
        title: book.title,
        authors: book.authors,
        categories: book.categories,
        description: book.description,
        language: book.language,
        pageCount: book.pageCount,
        averageRating: book.averageRating,
        image: book.image,
        reason: book.reason || "Completando recomendaciones",
      });
    } else {
      // Si no hay más libros, duplicar el último con variación
      const lastBook =
        descubriNuevasLecturas[descubriNuevasLecturas.length - 1];
      if (lastBook) {
        descubriNuevasLecturas.push({
          ...lastBook,
          volumeId: `${lastBook.volumeId}_alt`,
          reason: "Alternativa adicional",
        });
      }
      break;
    }
  }

  console.log(
    `[Fallback] Final: tePodrianGustar=${tePodrianGustar.length}, descubriNuevasLecturas=${descubriNuevasLecturas.length}`
  );

  return [...tePodrianGustar, ...descubriNuevasLecturas];
};

/**
 * Función principal para obtener recomendaciones del home
 */
const getHomeRecommendations = async (userId) => {
  try {
    // Verificar cache - Caché persistente por sesión
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

    // Obtener señales del usuario
    const signals = await getUserSignals(userId);
    console.log(
      `[Recommendations] Usuario ${userId}: ${signals.favoritos.length} favoritos, ${signals.historialCompleto.length} lecturas`
    );

    // Caso A: Sin favoritos y sin historial
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
      recommendationsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
      console.log(
        `[Cache] ✅ Caché guardado. Tamaño actual: ${recommendationsCache.size}`
      );
      return result;
    }

    // Caso B/C: Con favoritos o historial - Generar recomendaciones con LLM

    // Intentar con LLM
    console.log("[Recommendations] Intentando con LLM...");
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

      // Usar las recomendaciones que devolvió ChatGPT, sin importar la cantidad
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
            strategy: "llm+googlebooks",
            shortlistSize: 0,
          },
        };

        // Eliminar duplicados
        result = removeDuplicates(result);

        // Validar y corregir libros inválidos
        const correctedResult = await validateAndCorrectRecommendations(
          result,
          signals
        );
        if (correctedResult) {
          console.log(
            `[VALIDATION] ✅ Recomendaciones corregidas exitosamente`
          );
          result = correctedResult;
          console.log(`[Cache] 💾 Guardando en caché para usuario ${userId}`);
          console.log(`[Cache] Estrategia: ${result.metadata.strategy}`);
          recommendationsCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
          console.log(
            `[Cache] ✅ Caché guardado. Tamaño actual: ${recommendationsCache.size}`
          );
          return result;
        }
      }

      // Si el LLM no devolvió ninguna recomendación, usar fallback local
      console.log(
        `[LLM] No devolvió recomendaciones: tePodrianGustar=${tePodrianGustar.length}, descubriNuevasLecturas=${descubriNuevasLecturas.length}`
      );
      console.log("[LLM] Usando fallback local");
    } else {
      console.log("[Recommendations] LLM falló, usando fallback local");
    }

    // Fallback local - Usar defaults directamente (sin consultas a Google Books)
    console.log(
      "[Recommendations] LLM falló, usando defaults sin consultas adicionales"
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
      `[Cache] 💾 Guardando fallback local en caché para usuario ${userId}`
    );
    console.log(`[Cache] Estrategia: ${result.metadata.strategy}`);
    recommendationsCache.set(cacheKey, {
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

/**
 * Elimina duplicados de las recomendaciones
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
 * Valida que las recomendaciones no incluyan libros del historial o favoritos
 */
const validateRecommendations = (result, signals) => {
  const historialIds = new Set(signals.historialCompleto);
  const favoritoIds = new Set(signals.favoritos.map((fav) => fav.volumeId));

  // Verificar tePodrianGustar
  for (const book of result.tePodrianGustar) {
    if (historialIds.has(book.volumeId) || favoritoIds.has(book.volumeId)) {
      console.log(
        `[Validation] ❌ Libro inválido en tePodrianGustar: ${book.title}`
      );
      return false;
    }
  }

  // Verificar descubriNuevasLecturas
  for (const book of result.descubriNuevasLecturas) {
    if (historialIds.has(book.volumeId) || favoritoIds.has(book.volumeId)) {
      console.log(
        `[Validation] ❌ Libro inválido en descubriNuevasLecturas: ${book.title}`
      );
      return false;
    }
  }

  return true;
};

/**
 * Valida y corrige recomendaciones reemplazando libros inválidos
 */
const validateAndCorrectRecommendations = async (result, signals) => {
  const historialIds = new Set(signals.historialCompleto);
  const favoritoIds = new Set(signals.favoritos.map((fav) => fav.volumeId));
  let hasInvalidBooks = false;

  // Corregir tePodrianGustar
  for (let i = 0; i < result.tePodrianGustar.length; i++) {
    const book = result.tePodrianGustar[i];
    if (historialIds.has(book.volumeId) || favoritoIds.has(book.volumeId)) {
      console.log(
        `[Validation] ❌ Reemplazando libro inválido en tePodrianGustar: ${book.title}`
      );

      // Buscar un libro de reemplazo
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
 * Busca un libro de reemplazo que no esté en el historial o favoritos
 */
const findReplacementBook = async (signals, existingBooks) => {
  const historialIds = new Set(signals.historialCompleto);
  const favoritoIds = new Set(signals.favoritos.map((fav) => fav.volumeId));
  const existingIds = new Set(existingBooks.map((book) => book.volumeId));

  // Lista de libros de reemplazo populares
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

  for (const book of replacementBooks) {
    try {
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
  getUserSignals,
  searchSpecificBook,
  searchGoogleBooks,
};
