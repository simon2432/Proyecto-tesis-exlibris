import { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/ApiConfig";

export interface Publicacion {
  id: number;
  titulo: string;
  autor: string;
  genero: string;
  editorial: string;
  paginas: number;
  idioma: string;
  estadoLibro: string;
  precio: number;
  imagenUrl: string | null;
  fechaPublicacion: string;
  vendedor: {
    id: number;
    nombre: string;
    ubicacion: string | null;
    puntuacionVendedor: number | null;
  };
}

export const usePublicaciones = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicaciones = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/publicaciones`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setPublicaciones(response.data);
    } catch (err) {
      console.error("Error fetching publicaciones:", err);
      setError("Error al cargar las publicaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicaciones();
  }, []);

  return {
    publicaciones,
    loading,
    error,
    refetch: fetchPublicaciones,
  };
};
