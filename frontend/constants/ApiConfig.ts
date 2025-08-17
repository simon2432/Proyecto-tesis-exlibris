import { Platform } from "react-native";

// URLs base para diferentes entornos
const API_URLS = {
  // Para desarrollo local (web)
  local: "http://localhost:3001",
  // Para emulador Android (usa 10.0.2.2 en lugar de localhost)
  androidEmulator: "http://10.0.2.2:3001",
  // Para dispositivos móviles físicos (iOS/Android en dispositivo real)
  mobile: "http:// 192.168.0.113", // <--- Cambia esta IP por la de tu PC
  // Para producción (cuando despliegues)
  production: "https://tu-backend-produccion.com",
};

// Función para obtener la URL base según la plataforma
export const getApiUrl = (): string => {
  // Si estás en web, usa localhost
  if (Platform.OS === "web") {
    return API_URLS.local;
  }

  // Si estás en Android emulador, usa 10.0.2.2
  if (Platform.OS === "android") {
    return API_URLS.androidEmulator;
  }

  // Si estás en iOS físico, usa la IP local
  if (Platform.OS === "ios") {
    return API_URLS.mobile;
  }

  // Por defecto, usa la IP local
  return API_URLS.mobile;
};

// URL base para usar en toda la app
export const API_BASE_URL = getApiUrl();

// Función para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
