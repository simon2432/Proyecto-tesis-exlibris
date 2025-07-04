import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants/ApiConfig";

export type LibroFavorito = { id: string; portada: string; title: string };

export interface User {
  id: number;
  nombre: string;
  email: string;
  documento?: number;
  ubicacion?: string;
  fotoPerfil?: string;
  librosFavoritos?: LibroFavorito[];
}

export const UserContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
  setLibroFavorito?: (slot: number, libro: LibroFavorito) => void;
}>(null as any);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    const fetchFavoritos = async () => {
      if (!user) return;
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/usuarios/favoritos`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setUser((prev) =>
          prev ? { ...prev, librosFavoritos: res.data.librosFavoritos } : prev
        );
      } catch {}
    };
    fetchFavoritos();
  }, [user?.id]);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error loading user from storage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserAndStore = async (userData: User | null) => {
    setUser(userData);
    if (userData) {
      await AsyncStorage.setItem("user", JSON.stringify(userData));
    } else {
      await AsyncStorage.removeItem("user");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  const setLibroFavorito = async (slot: number, libro: LibroFavorito) => {
    let nuevosFavoritos: LibroFavorito[] = [];
    setUser((prev) => {
      if (!prev) return prev;
      nuevosFavoritos = [
        ...((prev as any).librosFavoritos ?? [null, null, null]),
      ];
      nuevosFavoritos[slot] = libro;
      return { ...prev, librosFavoritos: nuevosFavoritos };
    });
    setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        await axios.put(
          `${API_BASE_URL}/usuarios/favoritos`,
          {
            librosFavoritos: nuevosFavoritos,
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
      } catch {}
    }, 0);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: setUserAndStore,
        logout,
        isLoading,
        setLibroFavorito,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
