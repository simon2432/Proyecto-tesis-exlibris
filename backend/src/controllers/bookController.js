const axios = require("axios");

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
        authors: (item.volumeInfo.authors || []).join(", "),
        description: item.volumeInfo.description,
        image: item.volumeInfo.imageLinks.thumbnail,
      }));

    const uniqueBooks = [];
    const seenIds = new Set();
    for (const book of books) {
      if (!seenIds.has(book.id)) {
        uniqueBooks.push(book);
        seenIds.add(book.id);
      }
    }

    res.json({ books: uniqueBooks });
  } catch (error) {
    res.status(500).json({ error: "Error buscando en Google Books" });
  }
};
