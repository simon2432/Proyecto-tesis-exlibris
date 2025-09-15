/**
 * Sistema inteligente para priorizar la mejor versión de cualquier libro
 * basado en múltiples criterios de calidad
 */

/**
 * Prioriza libros de forma SIMPLE y RÁPIDA - solo por imagen y autor
 */
const prioritizeBooksByQuality = (books, searchQuery = null) => {
  if (!books || books.length === 0) return [];

  console.log(`[Quality] Priorizando ${books.length} libros (modo rápido)...`);

  // Ordenar por criterios simples: imagen primero, luego autor
  const prioritizedBooks = books
    .filter((book) => book.title) // Solo libros con título
    .sort((a, b) => {
      // 1. Priorizar libros con imagen
      const aHasImage = a.image && !a.image.includes("placehold.co");
      const bHasImage = b.image && !b.image.includes("placehold.co");

      if (aHasImage && !bHasImage) return -1;
      if (!aHasImage && bHasImage) return 1;

      // 2. Priorizar libros con autor
      const aHasAuthor = a.authors && a.authors.length > 0;
      const bHasAuthor = b.authors && b.authors.length > 0;

      if (aHasAuthor && !bHasAuthor) return -1;
      if (!aHasAuthor && bHasAuthor) return 1;

      return 0;
    });

  console.log(
    `[Quality] Priorizados ${prioritizedBooks.length} libros (modo rápido)`
  );
  return prioritizedBooks;
};

/**
 * Encuentra la mejor versión dentro de un grupo de libros del mismo título
 */
const findBestVersionInGroup = (books, groupTitle) => {
  if (!books || books.length === 0) return null;
  if (books.length === 1) return books[0];

  // Criterios simples para seleccionar la mejor versión:
  // 1. Que tenga imagen
  // 2. Que tenga autor
  // 3. Que tenga descripción
  // 4. Que no sea un resumen/guía

  const scoredBooks = books.map((book) => {
    let score = 0;

    // Bonus por tener imagen
    if (book.image && !book.image.includes("placehold.co")) {
      score += 10;
    }

    // Bonus por tener autor
    if (book.authors && book.authors.length > 0) {
      score += 5;
    }

    // Bonus por tener descripción
    if (book.description && book.description.length > 50) {
      score += 3;
    }

    // Penalizar resúmenes y guías
    const title = book.title.toLowerCase();
    if (
      title.includes("resumen") ||
      title.includes("guía") ||
      title.includes("manual")
    ) {
      score -= 5;
    }

    return { book, score };
  });

  // Ordenar por score y tomar el mejor
  scoredBooks.sort((a, b) => b.score - a.score);

  console.log(
    `[Quality] Mejor versión de "${groupTitle}": ${scoredBooks[0].book.title} (score: ${scoredBooks[0].score})`
  );

  return scoredBooks[0].book;
};

module.exports = {
  prioritizeBooksByQuality,
};
