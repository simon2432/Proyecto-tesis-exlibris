const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { getDefaultRecommendations } = require("./homeDefaults");

const prisma = new PrismaClient();
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Cache persistente por sesión (solo se invalida al relogear)
const recommendationsCache = new Map();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días (prácticamente permanente por sesión)

/**
 * Obtiene las señales del usuario (favoritos, historial, likes/dislikes)
 */
const getUserSignals = async (userId) => {
  try {
    // Obtener usuario con favoritos
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { librosFavoritos: true },
    });

    // Obtener historial de lecturas
    const lecturas = await prisma.lectura.findMany({
      where: { userId: parseInt(userId) },
      select: {
        libroId: true,
        reviewRating: true,
      },
    });

    // Procesar favoritos
    const favoritos = [];
    if (user?.librosFavoritos) {
      try {
        const favs = JSON.parse(user.librosFavoritos);
        if (Array.isArray(favs)) {
          favoritos.push(...favs.slice(0, 3)); // Top 3
        }
      } catch (e) {
        console.error("Error parsing favoritos:", e);
      }
    }

    // Separar historial en likes/dislikes
    const historialLikes = [];
    const historialDislikes = [];
    const historialCompleto = [];

    for (const lectura of lecturas) {
      historialCompleto.push(lectura.libroId);

      if (lectura.reviewRating) {
        if (lectura.reviewRating >= 3) {
          // TODO: Enriquecer con datos de Google Books si es necesario
          historialLikes.push({
            volumeId: lectura.libroId,
            title: `Libro ${lectura.libroId}`,
            authors: [],
            categories: [],
          });
        } else {
          historialDislikes.push({
            volumeId: lectura.libroId,
            title: `Libro ${lectura.libroId}`,
            authors: [],
            categories: [],
          });
        }
      }
    }

    return {
      favoritos,
      historialLikes,
      historialDislikes,
      historialCompleto,
    };
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
      }));
  } catch (error) {
    console.error(`Error searching Google Books with query "${query}":`, error);
    return [];
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
    // Verificar que el libro no esté ya en la shortlist
    if (seenIds.has(book.volumeId)) continue;

    // Verificar que el libro no esté en el historial de lecturas
    if (historialCompleto.includes(book.volumeId)) continue;

    // Verificar que el libro no esté en favoritos
    if (favoritos.some((fav) => fav.volumeId === book.volumeId)) continue;

    // Verificar que el libro tenga un volumeId válido
    if (!book.volumeId || book.volumeId.trim() === "") continue;

    // Verificar que no excedamos el límite
    if (shortlist.length >= 120) break;

    seenIds.add(book.volumeId);
    shortlist.push(book);
  }
};

/**
 * Llama a ChatGPT para seleccionar los libros recomendados
 */
const callLLMForPicks = async (shortlist, signals) => {
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key no configurada");
    return null;
  }

  try {
    const prompt = buildLLMPrompt(shortlist, signals);

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

    try {
      // Intentar parsear la respuesta JSON
      const parsed = JSON.parse(content);

      // Validar estructura básica
      if (
        parsed.te_podrian_gustar &&
        parsed.descubri_nuevas_lecturas &&
        Array.isArray(parsed.te_podrian_gustar) &&
        Array.isArray(parsed.descubri_nuevas_lecturas)
      ) {
        return parsed;
      }
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
    }

    // Si falla, intentar una vez más con prompt de corrección
    return await retryLLMWithCorrection(shortlist, signals);
  } catch (error) {
    console.error("Error calling LLM:", error);
    return null;
  }
};

/**
 * Reintenta con un prompt de corrección si falla la primera vez
 */
const retryLLMWithCorrection = async (shortlist, signals) => {
  try {
    const correctionPrompt = buildLLMPrompt(shortlist, signals, true);

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
        max_tokens: 800,
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

    try {
      const parsed = JSON.parse(content);
      if (
        parsed.te_podrian_gustar &&
        parsed.descubri_nuevas_lecturas &&
        Array.isArray(parsed.te_podrian_gustar) &&
        Array.isArray(parsed.descubri_nuevas_lecturas)
      ) {
        return parsed;
      }
    } catch (parseError) {
      console.error("Error parsing LLM correction response:", parseError);
    }
  } catch (error) {
    console.error("Error in LLM correction attempt:", error);
  }

  return null;
};

/**
 * Construye el prompt para ChatGPT
 */
const buildLLMPrompt = (shortlist, signals, isCorrection = false) => {
  const systemPrompt = isCorrection
    ? `Sos un recomendador de libros **preciso**. Debés devolver **JSON ESTRICTO** con exactamente 12 items por lista, y **SOLO** podés elegir libros de la **shortlist** provista (identificados por \`volumeId\` de Google Books). No inventes IDs ni títulos.

IMPORTANTE: Tu respuesta anterior no fue válida. Ahora debés devolver EXACTAMENTE este formato JSON:
{
  "te_podrian_gustar": [
    { "volumeId": "xxx", "razon": "..." },
    ... (12 items en total)
  ],
  "descubri_nuevas_lecturas": [
    { "volumeId": "yyy", "razon": "..." },
    ... (12 items en total)
  ]
}

NO agregues texto adicional, solo el JSON.`
    : `Sos un recomendador de libros **preciso**. Debés devolver **JSON ESTRICTO** con exactamente 12 items por lista, y **SOLO** podés elegir libros de la **shortlist** provista (identificados por \`volumeId\` de Google Books). No inventes IDs ni títulos.

Objetivo:
- Lista A: "te_podrian_gustar" → lo más cercano a los 3 favoritos y a las lecturas bien valoradas (rating ≥ 3).
- Lista B: "descubri_nuevas_lecturas" → opciones conectadas pero más exploratorias/diversas (nuevos géneros/temas/autores plausibles).

Reglas:
- **No** incluyas libros ya leídos por el usuario (historial completo).
- **Evitar** similitudes fuertes con lecturas mal valoradas (rating ≤ 2), salvo que la conexión con favoritos/LIKES sea muy sólida y no haya alternativas.
- Respetá diversidad en la Lista B (no repitas autor si hay opciones, variá subgéneros/temáticas).
- Cada item debe incluir \`volumeId\` y una \`razon\` breve ("mismo autor", "tema afín", "deriva de X género hacia Y", etc.).

Devolvé **únicamente** este JSON:
{
  "te_podrian_gustar": [
    { "volumeId": "xxx", "razon": "..." },
    ... (12 items en total)
  ],
  "descubri_nuevas_lecturas": [
    { "volumeId": "yyy", "razon": "..." },
    ... (12 items en total)
  ]
}`;

  const userPrompt = `FAVORITOS (0–3):
${JSON.stringify(signals.favoritos)}

HISTORIAL — LEÍDOS CON RATING:
- LIKES (rating >= 3): 
${JSON.stringify(signals.historialLikes)}

- DISLIKES (rating <= 2): 
${JSON.stringify(signals.historialDislikes)}

IMPORTANTE:
- No recomendar ningún volumeId dentro de FAVORITOS ni HISTORIAL (ambos grupos).
- Evitar parecidos fuertes con DISLIKES si hay alternativas.

SHORTLIST (candidatos válidos — SOLO podés elegir de acá):
${JSON.stringify(shortlist)}

Necesito exactamente 12 items en "te_podrian_gustar" y 12 en "descubri_nuevas_lecturas".
Recordatorio: SOLO elegí \`volumeId\` de la shortlist.`;

  return { system: systemPrompt, user: userPrompt };
};

/**
 * Valida y completa la respuesta del LLM con datos de la shortlist
 */
const postValidateAndHydrate = (llmResponse, shortlist, listType) => {
  const shortlistMap = new Map(shortlist.map((book) => [book.volumeId, book]));
  const result = [];

  // Determinar qué lista procesar
  const sourceList =
    listType === "te_podrian_gustar"
      ? llmResponse.te_podrian_gustar
      : llmResponse.descubri_nuevas_lecturas;

  for (const item of sourceList) {
    const book = shortlistMap.get(item.volumeId);
    if (book) {
      result.push({
        volumeId: item.volumeId,
        title: book.title,
        authors: book.authors,
        categories: book.categories,
        reason: item.razon,
      });
    }
  }

  return result;
};

/**
 * Fallback local usando scoring simple y MMR para diversidad
 */
const buildFallbackLocal = (shortlist, signals) => {
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

  // Garantizar que tengamos suficientes libros
  if (scoredBooks.length < 24) {
    // Si no hay suficientes, duplicar algunos libros con diferentes razones
    const needed = 24 - scoredBooks.length;
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

  // Seleccionar top 12 para "te podrian gustar"
  const tePodrianGustar = scoredBooks.slice(0, 12).map((book) => ({
    volumeId: book.volumeId,
    title: book.title,
    authors: book.authors,
    categories: book.categories,
    reason: book.reason || `Recomendado por afinidad (score: ${book.score})`,
  }));

  // MMR para "descubri nuevas lecturas" (diversidad)
  const descubriNuevasLecturas = [];
  const remainingBooks = scoredBooks.slice(12);

  // Garantizar que tengamos exactamente 12 libros para la segunda lista
  let booksToSelect = 12;

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
          reason: bestBook.reason || "Diversificación de lecturas",
        });
        selectedIds.add(bestBook.volumeId);
      }
    }
  }

  // Si aún no tenemos 12 libros, completar con los que falten
  while (descubriNuevasLecturas.length < 12) {
    const remainingIndex = descubriNuevasLecturas.length + 11;
    if (remainingIndex < scoredBooks.length) {
      const book = scoredBooks[remainingIndex];
      descubriNuevasLecturas.push({
        volumeId: book.volumeId,
        title: book.title,
        authors: book.authors,
        categories: book.categories,
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

  return [...tePodrianGustar, ...descubriNuevasLecturas];
};

/**
 * Función principal para obtener recomendaciones del home
 */
const getHomeRecommendations = async (userId) => {
  try {
    // Verificar cache
    const cacheKey = `home_recs_${userId}`;
    const cached = recommendationsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[Cache] Hit para usuario ${userId}, usando cache existente`);
      return cached.data;
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
      const defaults = getDefaultRecommendations();
      const result = {
        ...defaults,
        metadata: {
          ...defaults.metadata,
          userId,
        },
      };

      // Cachear
      recommendationsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
      return result;
    }

    // Caso B/C: Con favoritos o historial
    const shortlist = await fetchShortlistFromGoogleBooks(signals);
    console.log(
      `[Recommendations] Shortlist generada: ${shortlist.length} libros`
    );

    if (shortlist.length === 0) {
      // Fallback a defaults si no hay shortlist
      console.log("[Recommendations] Shortlist vacía, usando defaults");
      const defaults = getDefaultRecommendations();
      const result = {
        ...defaults,
        metadata: {
          ...defaults.metadata,
          userId,
        },
      };

      recommendationsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
      return result;
    }

    // Intentar con LLM
    console.log("[Recommendations] Intentando con LLM...");
    const llmResponse = await callLLMForPicks(shortlist, signals);

    if (llmResponse) {
      console.log("[Recommendations] LLM exitoso, validando respuesta...");
      const tePodrianGustar = postValidateAndHydrate(
        llmResponse,
        shortlist,
        "te_podrian_gustar"
      );
      const descubriNuevasLecturas = postValidateAndHydrate(
        llmResponse,
        shortlist,
        "descubri_nuevas_lecturas"
      );

      console.log(
        `[Recommendations] LLM devolvió: ${tePodrianGustar.length} + ${descubriNuevasLecturas.length} libros`
      );

      // Validar que tengamos 12+12 items
      if (
        tePodrianGustar.length === 12 &&
        descubriNuevasLecturas.length === 12
      ) {
        console.log("[Recommendations] LLM válido, usando respuesta");
        const result = {
          tePodrianGustar: tePodrianGustar.slice(0, 12),
          descubriNuevasLecturas: descubriNuevasLecturas.slice(0, 12),
          metadata: {
            userId,
            generatedAt: new Date().toISOString(),
            strategy: "llm+shortlist",
            shortlistSize: shortlist.length,
          },
        };

        recommendationsCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
        return result;
      }

      // Si el LLM no devolvió 12+12, completar con fallback local
      console.log("[LLM] Respuesta incompleta, completando con fallback local");
    } else {
      console.log("[Recommendations] LLM falló, usando fallback local");
    }

    // Fallback local
    console.log("[Recommendations] Usando fallback local");
    const fallbackItems = buildFallbackLocal(shortlist, signals);

    // Validación final: asegurar que siempre tengamos 12+12 libros
    let tePodrianGustar = fallbackItems.slice(0, 12);
    let descubriNuevasLecturas = fallbackItems.slice(12, 24);

    console.log(
      `[Recommendations] Fallback local: ${tePodrianGustar.length} + ${descubriNuevasLecturas.length} libros`
    );

    // Si no tenemos suficientes libros, completar con defaults
    if (tePodrianGustar.length < 12) {
      const defaults = getDefaultRecommendations();
      const needed = 12 - tePodrianGustar.length;
      console.log(
        `[Recommendations] Completando tePodrianGustar con ${needed} defaults`
      );
      tePodrianGustar = [
        ...tePodrianGustar,
        ...defaults.tePodrianGustar.slice(0, needed),
      ];
    }

    if (descubriNuevasLecturas.length < 12) {
      const defaults = getDefaultRecommendations();
      const needed = 12 - descubriNuevasLecturas.length;
      console.log(
        `[Recommendations] Completando descubriNuevasLecturas con ${needed} defaults`
      );
      descubriNuevasLecturas = [
        ...descubriNuevasLecturas,
        ...defaults.descubriNuevasLecturas.slice(0, needed),
      ];
    }

    console.log(
      `[Recommendations] Final: ${tePodrianGustar.length} + ${descubriNuevasLecturas.length} libros`
    );

    const result = {
      tePodrianGustar: tePodrianGustar.slice(0, 12),
      descubriNuevasLecturas: descubriNuevasLecturas.slice(0, 12),
      metadata: {
        userId,
        generatedAt: new Date().toISOString(),
        strategy: "fallback-local",
        shortlistSize: shortlist.length,
      },
    };

    recommendationsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    console.log(`[Cache] Cacheado resultado para usuario ${userId}`);
    return result;
  } catch (error) {
    console.error("Error getting home recommendations:", error);

    // Fallback final a defaults
    console.log(
      "[Recommendations] Error crítico, usando defaults como último recurso"
    );
    const defaults = getDefaultRecommendations();
    return {
      ...defaults,
      metadata: {
        ...defaults.metadata,
        userId,
      },
    };
  }
};

/**
 * Invalidar cache de recomendaciones (solo al relogear)
 */
const invalidateRecommendationsCache = (userId) => {
  const cacheKey = `home_recs_${userId}`;
  recommendationsCache.delete(cacheKey);
  console.log(`[Cache] Invalidado cache para usuario ${userId} (relogear)`);
};

/**
 * Invalidar cache de recomendaciones para todos los usuarios (mantenimiento)
 */
const invalidateAllRecommendationsCache = () => {
  recommendationsCache.clear();
  console.log("[Cache] Invalidado cache completo de recomendaciones");
};

/**
 * Obtener estadísticas del cache
 */
const getCacheStats = () => {
  return {
    size: recommendationsCache.size,
    keys: Array.from(recommendationsCache.keys()),
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  getHomeRecommendations,
  invalidateRecommendationsCache,
  invalidateAllRecommendationsCache,
  getCacheStats,
};
