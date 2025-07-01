import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { Platform } from "react-native";

const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

// Cache simple para evitar búsquedas repetidas
const searchCache = new Map<string, any>();

export function useGoogleBooksSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInfo, setSearchInfo] = useState<{
    totalFound: number;
    totalReturned: number;
  } | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchBooks = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setSearchInfo(null);
      return;
    }

    const trimmedQuery = query.trim().toLowerCase();

    // Verificar cache primero
    if (searchCache.has(trimmedQuery)) {
      const cachedData = searchCache.get(trimmedQuery);
      setResults(cachedData.books || []);
      setSearchInfo(cachedData.searchInfo || null);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/books/search`, {
        params: { q: trimmedQuery },
      });

      const books = res.data.books || [];
      const searchInfo = {
        totalFound: res.data.totalFound || books.length,
        totalReturned: res.data.totalReturned || books.length,
      };

      setResults(books);
      setSearchInfo(searchInfo);

      // Guardar en cache (máximo 50 búsquedas)
      if (searchCache.size > 50) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) {
          searchCache.delete(firstKey);
        }
      }
      searchCache.set(trimmedQuery, { books, searchInfo });
    } catch (e) {
      setResults([]);
      setSearchInfo(null);
    }
    setLoading(false);
  }, []);

  // Función con debouncing para búsqueda automática
  const searchBooksDebounced = useCallback(
    (query: string) => {
      // Cancelar búsqueda anterior si existe
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Nueva búsqueda con delay de 300ms
      debounceTimeoutRef.current = setTimeout(() => {
        searchBooks(query);
      }, 300);
    },
    [searchBooks]
  );

  // Función para limpiar cache
  const clearCache = useCallback(() => {
    searchCache.clear();
  }, []);

  return {
    results,
    loading,
    searchBooks,
    searchBooksDebounced,
    clearCache,
    searchInfo,
  };
}
