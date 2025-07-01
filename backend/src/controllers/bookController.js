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

exports.searchGoogleBooks = async (req, res) => {
  const { q } = req.query;
  if (!q)
    return res.status(400).json({ error: "Falta el término de búsqueda" });

  try {
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      {
        params: {
          q: `intitle:${q}`,
          maxResults: 10,
          langRestrict: "es",
          printType: "books",
        },
      }
    );

    const books = (response.data.items || [])
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

    // Procesar libros y generar descripciones si faltan
    const processedBooks = [];
    for (const book of books) {
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

    const uniqueBooks = [];
    const seenIds = new Set();
    for (const book of processedBooks) {
      if (!seenIds.has(book.id)) {
        uniqueBooks.push(book);
        seenIds.add(book.id);
      }
    }

    res.json({ books: uniqueBooks });
  } catch (error) {
    console.error("Error en búsqueda:", error);
    res.status(500).json({ error: "Error buscando en Google Books" });
  }
};
