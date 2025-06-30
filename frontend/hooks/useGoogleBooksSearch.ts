import { useState } from "react";
import axios from "axios";
import { Platform } from "react-native";

const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://localhost:3001";

export function useGoogleBooksSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchBooks = async (query: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/books/search`, {
        params: { q: query },
      });
      setResults(res.data.books);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  return { results, loading, searchBooks };
}
