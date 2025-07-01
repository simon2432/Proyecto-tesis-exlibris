const axios = require("axios");

// Función auxiliar para generar descripción con OpenAI
const generateDescription = async (bookInfo) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en literatura que genera descripciones atractivas e informativas de libros. Siempre genera una descripción basada en la información disponible del libro, incluso si es limitada. Nunca respondas 'Descripción no encontrada'.",
          },
          {
            role: "user",
            content: `Genera una descripción atractiva y breve (máximo 200 palabras) para este libro basándote en la información disponible: ${bookInfo}`,
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

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generando descripción:", error);
    return "Descripción no disponible";
  }
};

// Función para verificar si el título contiene las palabras de búsqueda de forma flexible
const titleMatchesSearch = (title, searchQuery) => {
  if (!title || !searchQuery) return false;

  const titleLower = title.toLowerCase();
  const searchWords = searchQuery
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 0);

  // Si solo hay una palabra, buscar coincidencias parciales
  if (searchWords.length === 1) {
    const searchWord = searchWords[0];
    // Buscar la palabra completa o como parte de otra palabra
    return titleLower.includes(searchWord);
  }

  // Si hay múltiples palabras, al menos una debe estar en el título
  return searchWords.some((word) => titleLower.includes(word));
};

exports.searchGoogleBooks = async (req, res) => {
  const { q, generateDescriptions = "false" } = req.query;
  if (!q)
    return res.status(400).json({ error: "Falta el término de búsqueda" });

  try {
    // Búsqueda más amplia para obtener más opciones
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: q, // Búsqueda general para obtener más resultados
          maxResults: 40, // Solicitar hasta 40 para tener más opciones
          langRestrict: "es",
          printType: "books",
          orderBy: "relevance", // Ordenar por relevancia
        },
      }
    );

    const allBooks = (response.data.items || [])
      .filter((item) => item.volumeInfo.imageLinks?.thumbnail)
      .map((item) => ({
        id: item.id,
        title: item.volumeInfo.title,
        authors: item.volumeInfo.authors || [],
        publisher: item.volumeInfo.publisher || "",
        publishedDate: item.volumeInfo.publishedDate || "",
        description: item.volumeInfo.description || "",
        pageCount: item.volumeInfo.pageCount || "",
        categories: item.volumeInfo.categories || [],
        language: item.volumeInfo.language || "",
        image: item.volumeInfo.imageLinks.thumbnail,
      }));

    // Filtrar libros que tengan las palabras de búsqueda en el título
    const matchingBooks = allBooks.filter((book) =>
      titleMatchesSearch(book.title, q)
    );

    // Solo generar descripciones si se solicita explícitamente
    let processedBooks = matchingBooks;
    if (generateDescriptions === "true") {
      processedBooks = [];
      for (const book of matchingBooks) {
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
    res.status(500).json({ error: "Error buscando en Google Books" });
  }
};

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
