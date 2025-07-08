/**
 * Utilidades para manejar imágenes de Google Books con mejor calidad
 */

/**
 * Obtiene la URL de imagen de mejor calidad disponible de Google Books
 * @param imageLinks - Objeto con los enlaces de imagen de Google Books
 * @returns URL de la imagen de mejor calidad disponible
 */
export const getBestQualityImage = (imageLinks: any): string => {
  if (!imageLinks) {
    return "https://placehold.co/200x280";
  }

  // Intentar obtener la imagen de mayor calidad disponible
  const imageUrl = imageLinks.thumbnail || imageLinks.smallThumbnail;

  if (!imageUrl) {
    return "https://placehold.co/200x280";
  }

  // Mejorar la calidad de la imagen de Google Books
  // zoom=1 es la calidad estándar, zoom=2 es mejor calidad
  let improvedUrl = imageUrl;

  if (imageUrl.includes("zoom=1")) {
    improvedUrl = imageUrl.replace("zoom=1", "zoom=2");
  } else if (imageUrl.includes("zoom=5")) {
    // Si ya está en zoom=5, mantener esa calidad
    improvedUrl = imageUrl;
  } else if (!imageUrl.includes("zoom=")) {
    // Si no tiene parámetro zoom, agregar zoom=2
    const separator = imageUrl.includes("?") ? "&" : "?";
    improvedUrl = `${imageUrl}${separator}zoom=2`;
  }

  return improvedUrl;
};

/**
 * Obtiene una imagen placeholder de mejor calidad
 * @param width - Ancho de la imagen
 * @param height - Alto de la imagen
 * @returns URL del placeholder
 */
export const getPlaceholderImage = (
  width: number = 200,
  height: number = 280
): string => {
  return `https://placehold.co/${width}x${height}`;
};

/**
 * Precachea una imagen para mejorar el rendimiento
 * @param imageUrl - URL de la imagen a precachear
 */
export const precacheImage = async (imageUrl: string): Promise<void> => {
  try {
    const { Image } = await import("expo-image");
    await Image.prefetch(imageUrl);
  } catch (error) {
    console.warn("Error precacheando imagen:", error);
  }
};

/**
 * Configuración optimizada para ExpoImage
 */
export const getOptimizedImageConfig = () => ({
  contentFit: "cover" as const,
  transition: 300,
  cachePolicy: "memory-disk" as const,
  priority: "high" as const,
});
