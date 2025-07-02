import { Platform } from "react-native";

// URLs base para diferentes entornos
const API_URLS = {
  // Para desarrollo local (web y emulador Android)
  local: "http://localhost:3001",
  // Para dispositivos móviles físicos (necesita ser accesible desde internet)
  mobile: "http://192.168.0.111:3001", // Reemplaza TU_IP_AQUI con tu IP real
  // Para producción (cuando despliegues)
  production: "https://tu-backend-produccion.com",
};

// Función para obtener la URL base según la plataforma
export const getApiUrl = (): string => {
  // Si estás en web, usa localhost
  if (Platform.OS === "web") {
    return API_URLS.local;
  }

  // Si estás en Android emulador, usa localhost
  if (Platform.OS === "android") {
    return API_URLS.local;
  }

  // Si estás en iOS físico, usa la IP local
  if (Platform.OS === "ios") {
    return API_URLS.mobile;
  }

  // Por defecto, usa local
  return API_URLS.local;
};

// URL base para usar en toda la app
export const API_BASE_URL = getApiUrl();

// Función para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
