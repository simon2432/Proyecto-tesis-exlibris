const axios = require("axios");

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// Función para obtener imagen individual de un libro
const getBookImageIndividual = async (bookId) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${GOOGLE_BOOKS_API_KEY}`,
      { timeout: 5000 }
    );

    let imageUrl =
      response.data.volumeInfo?.imageLinks?.thumbnail ||
      response.data.volumeInfo?.imageLinks?.smallThumbnail ||
      "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen";

    // Mejorar la calidad de la imagen de Google Books
    if (
      imageUrl &&
      imageUrl !== "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen"
    ) {
      if (imageUrl.includes("zoom=1")) {
        imageUrl = imageUrl.replace("zoom=1", "zoom=2");
      } else if (!imageUrl.includes("zoom=")) {
        const separator = imageUrl.includes("?") ? "&" : "?";
        imageUrl = `${imageUrl}${separator}zoom=2`;
      }

      // Asegurar que la URL sea HTTPS
      if (imageUrl.startsWith("http://")) {
        imageUrl = imageUrl.replace("http://", "https://");
      }
    }

    return imageUrl;
  } catch (error) {
    console.log(
      `[GoogleBooks] Error obteniendo imagen individual para ${bookId}:`,
      error.message
    );
    return "https://placehold.co/160x230/FFF4E4/3B2412?text=Sin+imagen";
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GENERACIÓN DE DESCRIPCIONES CON CHATGPT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera una descripción REAL de un libro usando ChatGPT
 *
 * IMPORTANTE: Solo genera descripciones si ChatGPT CONOCE el libro
 * NO inventa ni especula sobre contenido desconocido
 *
 * MODELO: GPT-4o-mini (mejor conocimiento literario que GPT-3.5)
 * TEMPERATURA: 0.5
 *
 * USO: Se llama automáticamente cuando un libro no tiene descripción en Google Books
 */
const generateDescription = async (bookInfo) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // Modelo más inteligente para descripciones reales
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en literatura que genera descripciones precisas y atractivas de libros. Genera descripciones basándote en tu conocimiento de la obra. Si conoces el libro, proporciona una descripción detallada y real. Si no tienes suficiente información, genera una descripción general basándote en el título, autor y género, indicando que es una descripción general. SOLO responde 'Descripción no disponible' si absolutamente no tienes ninguna información sobre el libro.",
          },
          {
            role: "user",
            content: `Genera una descripción atractiva y precisa (máximo 200 palabras) para este libro:

Información del libro:
${bookInfo}

La descripción debe incluir:
- Un resumen del contenido (si conoces el libro) o una descripción general basada en el título/autor/género
- El género o estilo literario
- Por qué podría ser interesante para el lector
- Sin spoilers importantes

Si no conoces este libro específico pero conoces al autor o el género, genera una descripción general. Solo responde "Descripción no disponible" si no tienes absolutamente ninguna información.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const description = response.data.choices[0].message.content.trim();

    // Log para debugging
    console.log(
      `[ChatGPT] Descripción generada para: ${bookInfo.substring(0, 50)}...`
    );
    console.log(`[ChatGPT] Respuesta: ${description.substring(0, 100)}...`);

    return description;
  } catch (error) {
    console.error("Error generando descripción con ChatGPT:", error.message);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    return "Descripción no disponible";
  }
};

// Función para verificar si el título contiene las palabras de búsqueda de forma muy flexible
const titleMatchesSearch = (title, searchQuery) => {
  if (!title || !searchQuery) return false;

  const titleLower = title.toLowerCase();
  const searchWords = searchQuery
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 2); // Solo palabras de más de 2 caracteres

  // Si no hay palabras significativas, no hacer match
  if (searchWords.length === 0) return false;

  // Normalizar títulos para comparación más precisa
  const normalizeTitle = (title) =>
    title
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Reemplazar puntuación con espacios
      .replace(/\s+/g, " ") // Normalizar espacios múltiples
      .trim();

  const normalizedTitle = normalizeTitle(titleLower);
  const normalizedSearch = normalizeTitle(searchQuery.toLowerCase());

  // MUY FLEXIBLE: si al menos una palabra importante coincide, incluir el libro
  const hasImportantMatch = searchWords.some(
    (word) => normalizedTitle.includes(word) && word.length >= 3
  );

  // También verificar si el título contiene la búsqueda completa
  const containsFullSearch = normalizedTitle.includes(normalizedSearch);

  return hasImportantMatch || containsFullSearch;
};

// Función para verificar si un autor coincide con la búsqueda
const authorMatchesSearch = (authors, searchQuery) => {
  if (
    !authors ||
    !Array.isArray(authors) ||
    authors.length === 0 ||
    !searchQuery
  )
    return false;

  const searchQueryLower = searchQuery.toLowerCase().trim();

  return authors.some((author) => {
    const authorLower = author.toLowerCase();

    // Búsqueda simple: si el término de búsqueda está contenido en el nombre del autor
    return authorLower.includes(searchQueryLower);
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS DE BÚSQUEDA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /books/search?q={query}&generateDescriptions={true/false}&filter={libro|autor|genero}
 * Busca libros en Google Books API con filtros y opciones
 *
 * PARÁMETROS:
 * - q: Término de búsqueda
 * - generateDescriptions: Si debe generar descripciones con ChatGPT (opcional)
 * - filter: Tipo de búsqueda (libro, autor, genero)
 *
 * FLUJO:
 * 1. Busca en Google Books API según el filtro
 * 2. Filtra resultados por relevancia
 * 3. Prioriza versión del caché si existe (consistencia)
 * 4. Si generateDescriptions=true, completa descripciones faltantes con ChatGPT
 * 5. Retorna hasta 20 libros ordenados por calidad
 *
 * OPTIMIZACIONES:
 * - Prioriza libros con imagen real
 * - Mantiene consistencia con recomendaciones del home
 * - Filtra resúmenes y guías de estudio
 */
exports.searchGoogleBooks = async (req, res) => {
  const { q, generateDescriptions = "false", filter } = req.query;
  if (!q)
    return res.status(400).json({ error: "Falta el término de búsqueda" });

  // Verificar que la API key esté configurada
  if (!GOOGLE_BOOKS_API_KEY) {
    console.error(
      "[GoogleBooks] Error: GOOGLE_BOOKS_API_KEY no está configurada"
    );
    return res
      .status(500)
      .json({ error: "Error de configuración del servidor" });
  }

  try {
    console.log("[GoogleBooks] Buscando:", q, "con filtro:", filter);

    // Construir query según el filtro seleccionado
    let searchQuery = q;
    if (filter === "autor") {
      // Para autores, usar búsqueda general pero más amplia
      // La API de Google Books a veces no funciona bien con inauthor
      searchQuery = q;
    } else if (filter === "genero") {
      searchQuery = `subject:"${q}"`;
    } else {
      // Para búsqueda de libros, usar intitle para ser más específico con títulos
      searchQuery = `intitle:"${q}"`;
    }

    // Búsqueda más amplia para obtener más opciones
    const maxResults = 40; // Máximo permitido por la API de Google Books

    console.log(
      `[GoogleBooks] Haciendo request a API con query: "${searchQuery}"`
    );

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?key=${GOOGLE_BOOKS_API_KEY}`,
      {
        params: {
          q: searchQuery, // Búsqueda específica según filtro
          maxResults: maxResults, // Más resultados para autores
          printType: "books",
          orderBy: "relevance", // Ordenar por relevancia
        },
        timeout: 10000, // Timeout de 10 segundos
      }
    );
    console.log(
      "[GoogleBooks] Respuesta recibida, items:",
      response.data.items?.length || 0
    );

    const allBooks = (response.data.items || []).map((item) => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || [],
      publisher: item.volumeInfo.publisher || "",
      publishedDate: item.volumeInfo.publishedDate || "",
      description: item.volumeInfo.description || "",
      pageCount: item.volumeInfo.pageCount || "",
      categories: item.volumeInfo.categories || [],
      language: item.volumeInfo.language || "",
      image:
        item.volumeInfo.imageLinks?.thumbnail ||
        item.volumeInfo.imageLinks?.smallThumbnail ||
        null, // Marcar como null si no hay imagen para consultar individualmente
    }));

    // Filtrar libros según el tipo de búsqueda
    let matchingBooks = allBooks;
    if (filter === "libro" || !filter) {
      // Para búsqueda por libro, filtrar por título
      matchingBooks = allBooks.filter((book) =>
        titleMatchesSearch(book.title, q)
      );

      // Ordenar: libros CON imagen primero, libros SIN imagen al final
      matchingBooks.sort((a, b) => {
        const aHasImage = a.image && !a.image.includes("placehold.co");
        const bHasImage = b.image && !b.image.includes("placehold.co");

        if (aHasImage && !bHasImage) return -1; // a va primero
        if (!aHasImage && bHasImage) return 1; // b va primero
        return 0; // mantener orden original si ambos tienen o no tienen imagen
      });

      // Verificar si hay una versión recomendada en cache
      const {
        getRecommendedVersion,
      } = require("../services/recs/recommendationCache");
      const cachedVersion = getRecommendedVersion(q);

      if (cachedVersion) {
        // Buscar si la versión del cache está en los resultados
        const cachedBook = matchingBooks.find(
          (book) => book.id === cachedVersion.volumeId
        );
        if (cachedBook) {
          // Mover la versión del cache al inicio
          matchingBooks = matchingBooks.filter(
            (book) => book.id !== cachedVersion.volumeId
          );
          matchingBooks.unshift(cachedBook);
          console.log(
            `[GoogleBooks] Priorizando versión del cache: ${cachedBook.title} (ID: ${cachedBook.id})`
          );
        } else {
          console.log(
            `[GoogleBooks] Versión del cache no encontrada en resultados actuales`
          );
        }
      } else {
        // Aplicar sistema inteligente de priorización por calidad solo si no hay cache
        const {
          prioritizeBooksByQuality,
        } = require("../services/recs/preferredBooks");
        matchingBooks = prioritizeBooksByQuality(matchingBooks, q);
        console.log(`[GoogleBooks] Priorizando por calidad (sin cache)`);
      }

      console.log(
        `[GoogleBooks] Filtro libro: ${matchingBooks.length} libros encontrados`
      );
    } else if (filter === "autor") {
      // Para búsqueda por autor, filtrar inteligentemente
      console.log(`[GoogleBooks] Buscando autor: "${q}"`);
      console.log(
        `[GoogleBooks] Total de libros antes del filtro: ${allBooks.length}`
      );

      const searchQueryLower = q.toLowerCase().trim();

      matchingBooks = allBooks.filter((book) => {
        if (!book.authors || book.authors.length === 0) return false;

        // Verificar si algún autor contiene el término de búsqueda
        return book.authors.some((author) =>
          author.toLowerCase().includes(searchQueryLower)
        );
      });

      console.log(
        `[GoogleBooks] Filtro autor: ${matchingBooks.length} libros encontrados`
      );

      // Si no hay resultados, mostrar algunos ejemplos para debug
      if (matchingBooks.length === 0) {
        console.log(
          `[GoogleBooks] No se encontraron coincidencias para "${q}"`
        );
        const sampleBooks = allBooks.slice(0, 3);
        sampleBooks.forEach((book) => {
          console.log(
            `[GoogleBooks] Ejemplo: "${book.title}" por ${book.authors.join(
              ", "
            )}`
          );
        });
      }
    } else if (filter === "genero") {
      // Para búsqueda por género, verificar que las categorías contengan el término de búsqueda
      matchingBooks = allBooks.filter((book) =>
        book.categories.some((category) =>
          category.toLowerCase().includes(q.toLowerCase())
        )
      );
      console.log(
        `[GoogleBooks] Filtro género: ${matchingBooks.length} libros encontrados`
      );
    }

    // Obtener imágenes individuales para libros que no tienen imagen
    console.log(
      `[GoogleBooks] Obteniendo imágenes individuales para libros sin imagen...`
    );
    const booksWithImages = [];
    const booksWithoutImages = [];

    // Separar libros con y sin imagen
    matchingBooks.forEach((book) => {
      if (book.image && !book.image.includes("placehold.co")) {
        booksWithImages.push(book);
      } else {
        booksWithoutImages.push(book);
      }
    });

    // Obtener imágenes individuales para libros sin imagen (máximo 10 para no sobrecargar)
    const booksToProcess = booksWithoutImages.slice(0, 10);
    const imagePromises = booksToProcess.map(async (book) => {
      const imageUrl = await getBookImageIndividual(book.id);
      return { ...book, image: imageUrl };
    });

    const booksWithIndividualImages = await Promise.all(imagePromises);

    // Combinar libros con imagen original + libros con imagen individual + resto sin imagen
    const allProcessedBooks = [
      ...booksWithImages,
      ...booksWithIndividualImages,
      ...booksWithoutImages.slice(10), // Los que no se procesaron individualmente
    ];

    console.log(
      `[GoogleBooks] Procesados: ${
        booksWithImages.length
      } con imagen original, ${
        booksWithIndividualImages.length
      } con imagen individual, ${booksWithoutImages.length - 10} sin procesar`
    );

    // Solo generar descripciones si se solicita explícitamente
    let processedBooks = allProcessedBooks;
    if (generateDescriptions === "true") {
      processedBooks = [];
      for (const book of allProcessedBooks) {
        let finalBook = { ...book };

        // Si no hay descripción, generar una con OpenAI
        if (!book.description || book.description.trim() === "") {
          const bookInfo = `Título: ${book.title}${
            book.authors.length > 0 ? `, Autor: ${book.authors.join(", ")}` : ""
          }${book.publisher ? `, Editorial: ${book.publisher}` : ""}${
            book.publishedDate ? `, Año: ${book.publishedDate}` : ""
          }${
            book.categories.length > 0
              ? `, Género: ${book.categories.join(", ")}`
              : ""
          }`;

          finalBook.description = await generateDescription(bookInfo);
          finalBook.descriptionGenerated = true; // Flag para indicar que fue generada
        } else {
          finalBook.descriptionGenerated = false; // Flag para indicar que viene de Google Books
        }

        processedBooks.push(finalBook);
      }
    } else {
      // Si no se generan descripciones, solo agregar el flag
      processedBooks = matchingBooks.map((book) => ({
        ...book,
        descriptionGenerated: false,
      }));
    }

    const uniqueBooks = [];
    const seenIds = new Set();
    for (const book of processedBooks) {
      if (!seenIds.has(book.id)) {
        uniqueBooks.push(book);
        seenIds.add(book.id);
      }
    }

    // Solo limitar a 20 si hay más de 20 resultados
    const finalBooks =
      uniqueBooks.length > 20 ? uniqueBooks.slice(0, 20) : uniqueBooks;

    res.json({
      books: finalBooks,
      totalFound: uniqueBooks.length,
      totalReturned: finalBooks.length,
    });
  } catch (error) {
    console.error("Error en búsqueda:", error);

    // Manejo específico de errores de axios
    if (error.response) {
      console.error("[GoogleBooks] Error response data:", error.response.data);
      console.error(
        "[GoogleBooks] Error response status:",
        error.response.status
      );
      console.error(
        "[GoogleBooks] Error response headers:",
        error.response.headers
      );

      // Si es un error de la API de Google Books
      if (error.response.status === 403) {
        return res
          .status(500)
          .json({ error: "Error de autenticación con Google Books API" });
      } else if (error.response.status === 429) {
        return res
          .status(500)
          .json({ error: "Límite de consultas excedido en Google Books API" });
      } else if (error.response.status === 400) {
        console.error(
          "[GoogleBooks] Error 400 - Bad Request:",
          error.response.data
        );
        return res
          .status(500)
          .json({ error: "Error en la consulta a Google Books API" });
      }
    } else if (error.request) {
      console.error("[GoogleBooks] Error request:", error.request);
      return res
        .status(500)
        .json({ error: "Error de conexión con Google Books API" });
    } else {
      console.error("[GoogleBooks] Error:", error.message);
    }

    res.status(500).json({ error: "Error buscando en Google Books" });
  }
};

/**
 * POST /books/generate-description
 * Genera una descripción para un libro específico usando ChatGPT
 *
 * USO: Llamado desde pantallas de detalle cuando un libro no tiene descripción
 *
 * FLUJO:
 * 1. Recibe información del libro (título, autor, editorial, etc.)
 * 2. Llama a generateDescription (ChatGPT GPT-4o-mini)
 * 3. Retorna la descripción generada o "Descripción no disponible"
 */
exports.generateBookDescription = async (req, res) => {
  const { bookId, title, authors, publisher, publishedDate, categories } =
    req.body;

  if (!title) {
    return res.status(400).json({ error: "Falta el título del libro" });
  }

  try {
    const bookInfo = `Título: ${title}${
      authors && authors.length > 0
        ? `, Autor: ${Array.isArray(authors) ? authors.join(", ") : authors}`
        : ""
    }${publisher ? `, Editorial: ${publisher}` : ""}${
      publishedDate ? `, Año: ${publishedDate}` : ""
    }${
      categories && categories.length > 0
        ? `, Género: ${
            Array.isArray(categories) ? categories.join(", ") : categories
          }`
        : ""
    }`;

    const description = await generateDescription(bookInfo);

    res.json({
      description,
      descriptionGenerated: true,
    });
  } catch (error) {
    console.error("Error generando descripción:", error);
    res.status(500).json({ error: "Error generando descripción" });
  }
};
