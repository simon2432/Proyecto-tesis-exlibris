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

  const searchBooks = useCallback(
    async (query: string, filter?: string | null) => {
      console.log(
        "[Busqueda] searchBooks ejecutado con query:",
        query,
        "y filtro:",
        filter
      );
      try {
        if (!query || query.trim().length < 2) {
          setResults([]);
          setSearchInfo(null);
          return;
        }

        const trimmedQuery = query.trim().toLowerCase();
        const cacheKey = `${trimmedQuery}-${filter || "general"}`;

        // Verificar cache primero
        if (searchCache.has(cacheKey)) {
          const cachedData = searchCache.get(cacheKey);
          setResults(cachedData.books || []);
          setSearchInfo(cachedData.searchInfo || null);
          return;
        }

        setLoading(true);
        try {
          const params: any = { q: trimmedQuery };
          if (filter) {
            params.filter = filter;
          }

          const res = await axios.get(`${API_BASE_URL}/books/search`, {
            params,
          });

          let data = res.data;
          // Si la respuesta es string, intenta parsear como JSON
          if (typeof data === "string") {
            try {
              data = JSON.parse(data);
            } catch (e) {
              console.log(
                "[Busqueda] Error parseando respuesta como JSON:",
                e,
                data
              );
            }
          }
          // Si no tiene books pero tiene items, úsalo igual
          let books = data.books || data.items || [];
          if (!Array.isArray(books)) books = [];
          console.log("[Busqueda] Respuesta backend:", data);
          const searchInfo = {
            totalFound: data.totalFound || books.length,
            totalReturned: data.totalReturned || books.length,
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
          searchCache.set(cacheKey, { books, searchInfo });
        } catch (e) {
          setResults([]);
          setSearchInfo(null);
          console.log("[Busqueda] Error en llamada axios:", e);
        }
        setLoading(false);
      } catch (err) {
        console.log("[Busqueda] Error inesperado en searchBooks:", err);
      }
    },
    []
  );

  // Función con debouncing para búsqueda automática
  const searchBooksDebounced = useCallback(
    (query: string, filter?: string | null) => {
      // Cancelar búsqueda anterior si existe
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Nueva búsqueda con delay de 300ms
      debounceTimeoutRef.current = setTimeout(() => {
        searchBooks(query, filter);
      }, 300);
    },
    [searchBooks]
  );

  // Función para limpiar cache
  const clearCache = useCallback(() => {
    searchCache.clear();
  }, []);

  // Función para limpiar resultados actuales
  const clearResults = useCallback(() => {
    setResults([]);
    setSearchInfo(null);
  }, []);

  return {
    results,
    loading,
    searchBooks,
    searchBooksDebounced,
    clearCache,
    clearResults,
    searchInfo,
  };
}
