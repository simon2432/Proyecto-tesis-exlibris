import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: number;
  nombre: string;
  email: string;
  documento?: number;
  ubicacion?: string;
  fotoPerfil?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

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

  return (
    <UserContext.Provider
      value={{ user, setUser: setUserAndStore, logout, isLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};
