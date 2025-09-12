/**
 * Cache de recomendaciones para mantener consistencia entre
 * recomendaciones y búsqueda manual
 */

// Cache en memoria de las versiones usadas en recomendaciones
const recommendationCache = new Map();

/**
 * Guarda una versión específica de un libro en el cache
 */
const saveRecommendedVersion = (title, author, bookData) => {
  const key = `${title.toLowerCase()}_${author ? author.toLowerCase() : ""}`;
  recommendationCache.set(key, {
    volumeId: bookData.volumeId,
    title: bookData.title,
    authors: bookData.authors,
    categories: bookData.categories,
    description: bookData.description,
    language: bookData.language,
    pageCount: bookData.pageCount,
    averageRating: bookData.averageRating,
    image: bookData.image,
    timestamp: Date.now(),
  });

  console.log(
    `[Cache] Guardando versión recomendada: "${title}" (ID: ${bookData.volumeId})`
  );
};

/**
 * Obtiene la versión recomendada de un libro si existe en el cache
 */
const getRecommendedVersion = (title, author) => {
  const key = `${title.toLowerCase()}_${author ? author.toLowerCase() : ""}`;
  const cached = recommendationCache.get(key);

  if (cached) {
    // Verificar que el cache no sea muy viejo (24 horas)
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas en ms
    if (Date.now() - cached.timestamp < maxAge) {
      console.log(
        `[Cache] Usando versión en cache: "${title}" (ID: ${cached.volumeId})`
      );
      return cached;
    } else {
      console.log(`[Cache] Cache expirado para: "${title}"`);
      recommendationCache.delete(key);
    }
  }

  return null;
};

/**
 * Busca versiones similares en el cache (para casos donde el título/autor no coinciden exactamente)
 */
const findSimilarCachedVersion = (title, author) => {
  const titleLower = title.toLowerCase();
  const authorLower = author ? author.toLowerCase() : "";

  for (const [key, cached] of recommendationCache.entries()) {
    const [cachedTitle, cachedAuthor] = key.split("_");

    // Verificar si es el mismo libro
    if (cachedTitle === titleLower && cachedAuthor === authorLower) {
      // Verificar que el cache no sea muy viejo
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - cached.timestamp < maxAge) {
        console.log(
          `[Cache] Encontrada versión similar en cache: "${title}" (ID: ${cached.volumeId})`
        );
        return cached;
      }
    }
  }

  return null;
};

/**
 * Limpia el cache de entradas expiradas
 */
const cleanExpiredCache = () => {
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  const now = Date.now();

  for (const [key, cached] of recommendationCache.entries()) {
    if (now - cached.timestamp > maxAge) {
      recommendationCache.delete(key);
    }
  }
};

/**
 * Obtiene estadísticas del cache
 */
const getCacheStats = () => {
  return {
    size: recommendationCache.size,
    entries: Array.from(recommendationCache.keys()),
  };
};

module.exports = {
  saveRecommendedVersion,
  getRecommendedVersion,
  findSimilarCachedVersion,
  cleanExpiredCache,
  getCacheStats,
};
