/**
 * Sistema inteligente para priorizar la mejor versión de cualquier libro
 * basado en múltiples criterios de calidad
 */

/**
 * Prioriza libros agrupándolos por título normalizado y seleccionando la mejor versión de cada grupo
 */
const prioritizeBooksByQuality = (books, searchQuery = null) => {
  if (!books || books.length === 0) return [];

  console.log(`[Quality] Priorizando ${books.length} libros...`);

  // Agrupar libros por título normalizado
  const groups = {};
  books.forEach((book) => {
    if (!book.title) return;

    // Normalizar título para agrupar versiones del mismo libro
    const normalizedTitle = book.title
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!groups[normalizedTitle]) {
      groups[normalizedTitle] = [];
    }
    groups[normalizedTitle].push(book);
  });

  console.log(
    `[Quality] Encontrados ${Object.keys(groups).length} grupos únicos`
  );

  // Para cada grupo, seleccionar la mejor versión
  const prioritizedBooks = [];
  Object.entries(groups).forEach(([groupTitle, groupBooks]) => {
    if (groupBooks.length === 1) {
      // Si solo hay una versión, tomarla directamente
      prioritizedBooks.push(groupBooks[0]);
    } else {
      // Si hay múltiples versiones, seleccionar la mejor
      const bestVersion = findBestVersionInGroup(groupBooks, groupTitle);
      if (bestVersion) {
        prioritizedBooks.push(bestVersion);
      }
    }
  });

  console.log(`[Quality] Priorizados ${prioritizedBooks.length} libros únicos`);
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
