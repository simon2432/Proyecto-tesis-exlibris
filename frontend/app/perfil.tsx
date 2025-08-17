import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import HeaderPerfil from "../components/HeaderPerfil";
import CustomTabBar from "../components/CustomTabBar";
import { useRouter, useFocusEffect } from "expo-router";
import { useUser } from "../contexts/UserContext";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { API_BASE_URL } from "../constants/ApiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getPlaceholderImage,
  getOptimizedImageConfig,
} from "../utils/imageUtils";

// Precargar imágenes comunes
const preloadImages = () => {
  ExpoImage.prefetch("https://placehold.co/100x100");
  ExpoImage.prefetch("https://placehold.co/90x120");
};

export default function PerfilScreen() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [uploading, setUploading] = React.useState(false);
  const [lecturas, setLecturas] = useState<any[]>([]);
  const [portadas, setPortadas] = useState<{ [key: string]: string }>({});
  const [loadingLecturas, setLoadingLecturas] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    librosVendidos: 0,
    librosComprados: 0,
    puntuacionVendedor: 0,
    cantidadValoraciones: 0,
  });
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true);

  // Función para obtener lecturas
  const fetchLecturas = async () => {
    try {
      setLoadingLecturas(true);
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/lecturas/mias`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 5000, // Timeout de 5 segundos
      });

      setLecturas(res.data);

      // Las portadas ya vienen optimizadas del backend
      const portadasObj: { [key: string]: string } = { ...portadas }; // Mantén las portadas previas
      res.data.forEach((lectura: any) => {
        // Si ya hay una portada real, no la sobrescribas por el placeholder
        if (
          portadasObj[lectura.id] &&
          portadasObj[lectura.id] !== "https://placehold.co/90x120" &&
          (lectura.portada === "https://placehold.co/90x120" ||
            !lectura.portada)
        ) {
          // No sobrescribas la real por el placeholder
          return;
        }
        portadasObj[lectura.id] =
          lectura.portada || "https://placehold.co/90x120";
      });
      setPortadas(portadasObj);
    } catch (error) {
      console.error("Error al cargar lecturas:", error);
      // En caso de error, mostrar lecturas vacías
      setLecturas([]);
      setPortadas({});
    } finally {
      setLoadingLecturas(false);
    }
  };

  // Función para obtener estadísticas del usuario
  const fetchEstadisticas = async () => {
    try {
      setLoadingEstadisticas(true);
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/usuarios/estadisticas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 5000,
      });

      setEstadisticas(res.data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      // En caso de error, mantener valores por defecto
      setEstadisticas({
        librosVendidos: 0,
        librosComprados: 0,
        puntuacionVendedor: 0,
        cantidadValoraciones: 0,
      });
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  useEffect(() => {
    // Precargar imágenes comunes
    preloadImages();
    fetchLecturas();
    fetchEstadisticas();
  }, []);

  // Refrescar lecturas cuando se regrese al perfil
  useFocusEffect(
    React.useCallback(() => {
      fetchLecturas();
      fetchEstadisticas();
    }, [])
  );

  const handlePickImage = async () => {
    if (uploading) return;
    // Pedir permisos
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Se requieren permisos para acceder a tus fotos.");
      return;
    }
    // Seleccionar imagen
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (pickerResult.canceled) return;
    const localUri = pickerResult.assets[0].uri;
    const filename = localUri.split("/").pop();
    const ext = (filename && filename.split(".").pop()) || "jpg";
    let mimeType = "";
    if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
    else if (ext === "png") mimeType = "image/png";
    else mimeType = "image/jpeg"; // default

    // Subir imagen al backend
    const formData = new FormData();
    if (Platform.OS === "web") {
      // En web, fetch la imagen como blob
      const response = await fetch(localUri);
      const blob = await response.blob();
      const fileNameWithExt =
        filename && filename.includes(".") ? filename : `profile.${ext}`;
      const file = new File([blob], fileNameWithExt, { type: mimeType });
      formData.append("foto", file);
    } else {
      formData.append("foto", {
        uri: localUri,
        name: filename,
        type: mimeType,
      } as any);
    }

    try {
      setUploading(true);
      // Obtener token de autenticación si es necesario
      const token = await AsyncStorage.getItem("token");
      let res;
      if (Platform.OS === "web") {
        res = await fetch(`${API_BASE_URL}/usuarios/foto-perfil`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            setUser(data.user);
            Alert.alert("¡Éxito!", "Foto de perfil actualizada.");
          }
        } else {
          Alert.alert("Error", "Error al subir la foto de perfil.");
        }
      } else {
        res = await axios.post(
          `${API_BASE_URL}/usuarios/foto-perfil`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        if (res.data && res.data.user) {
          setUser(res.data.user);
          Alert.alert("¡Éxito!", "Foto de perfil actualizada.");
        }
      }
    } catch (err) {
      Alert.alert("Error", "Error al subir la foto de perfil.");
    } finally {
      setUploading(false);
    }
  };

  // Ordenar lecturas: primero en lectura (sin fecha de fin, por fechaInicio desc), luego finalizadas (por fechaFin desc)
  const lecturasOrdenadas = [...lecturas].sort((a, b) => {
    const aEnLectura = !a.fechaFin;
    const bEnLectura = !b.fechaFin;
    if (aEnLectura && !bEnLectura) return -1;
    if (!aEnLectura && bEnLectura) return 1;
    if (aEnLectura && bEnLectura) {
      // Ambas en lectura: más reciente primero
      return (
        new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
      );
    }
    // Ambas finalizadas: más reciente primero
    return new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime();
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <HeaderPerfil />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={styles.topButtonsRow}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.push("/agregar-lectura-buscar" as any)}
          >
            <Text style={styles.topButtonText}>Agregar lectura</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.push("/logros")}
          >
            <Text style={styles.topButtonText}>Ver logros</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profileSection}>
          <ExpoImage
            source={{
              uri: user?.fotoPerfil
                ? `${API_BASE_URL}${user.fotoPerfil}?t=${Date.now()}`
                : "https://placehold.co/100x100",
            }}
            style={styles.profileImage}
            placeholder="https://placehold.co/100x100"
            contentFit="cover"
            transition={200}
          />
          <Text style={styles.profileName}>{user?.nombre || "Usuario"}</Text>
          <Text style={styles.profileGenre}>
            Género más leído:{" "}
            <Text style={{ fontWeight: "bold" }}>Ciencia ficción</Text>
          </Text>
          <Text style={styles.profileBooks}>
            Libros leídos:{" "}
            <Text style={{ fontWeight: "bold" }}>
              {lecturas.filter((l) => l.fechaFin).length}
            </Text>
          </Text>
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Tus 3 libros favoritos</Text>
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => router.push("/favoritos-editar" as any)}
          >
            <Text style={styles.sectionButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.booksRowCentered}>
          {[0, 1, 2].map((idx) => {
            const libro = (user as any)?.librosFavoritos?.[idx] ?? null;
            return libro && libro.portada ? (
              <ExpoImage
                key={libro.id}
                source={{ uri: libro.portada || getPlaceholderImage(90, 120) }}
                style={styles.bookCoverPlaceholder}
                placeholder={getPlaceholderImage(90, 120)}
                {...getOptimizedImageConfig()}
              />
            ) : (
              <View key={idx} style={styles.bookCoverPlaceholder} />
            );
          })}
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Historial lector</Text>
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => router.push("/lectura-historial")}
          >
            <Text style={styles.sectionButtonText}>Ver historial completo</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 18, paddingRight: 18 }}
          style={{ marginBottom: 10, marginTop: 6 }}
        >
          {loadingLecturas ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 8,
              }}
            >
              <ActivityIndicator size="small" color="#7c4a2d" />
              <Text style={{ color: "#a08b7d", marginLeft: 8 }}>
                Cargando historial...
              </Text>
            </View>
          ) : lecturas.length === 0 ? (
            <Text
              style={{ color: "#a08b7d", fontStyle: "italic", marginLeft: 8 }}
            >
              No tienes lecturas aún.
            </Text>
          ) : (
            lecturasOrdenadas.slice(0, 10).map((lectura) => (
              <TouchableOpacity
                key={lectura.id}
                onPress={() => {
                  if (portadas[lectura.id] === "https://placehold.co/90x120") {
                    setPortadas((prev) => ({
                      ...prev,
                      [lectura.id]:
                        lectura.portada || "https://placehold.co/90x120",
                    }));
                  } else {
                    router.push({
                      pathname: "/lectura-historial/[id]" as any,
                      params: { id: lectura.id },
                    });
                  }
                }}
                style={{ marginRight: 10 }}
              >
                <View style={{ position: "relative" }}>
                  <ExpoImage
                    source={{
                      uri: lectura.portada || getPlaceholderImage(90, 120),
                    }}
                    style={styles.bookCoverPlaceholder}
                    placeholder={getPlaceholderImage(90, 120)}
                    {...getOptimizedImageConfig()}
                    priority="low"
                    onError={() => {
                      setPortadas((prev) => {
                        if (
                          prev[lectura.id] &&
                          prev[lectura.id] !== getPlaceholderImage(90, 120)
                        ) {
                          return prev;
                        }
                        return {
                          ...prev,
                          [lectura.id]: getPlaceholderImage(90, 120),
                        };
                      });
                    }}
                  />
                  {/* Chip de estado 'En lectura' */}
                  {!lectura.fechaFin && (
                    <View style={styles.chipLecturaPerfil}>
                      <Text style={styles.chipLecturaPerfilText}>
                        En lectura
                      </Text>
                    </View>
                  )}
                  {lectura.portada === "https://placehold.co/90x120" && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(255,255,255,0.7)",
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "#7c4a2d", fontWeight: "bold" }}>
                        Reintentar
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <View style={styles.sellerSection}>
          <Text style={styles.sellerTitle}>Perfil vendedor</Text>
          <Text style={styles.sellerStat}>
            Libros vendidos:{" "}
            <Text style={{ fontWeight: "bold" }}>
              {loadingEstadisticas ? "..." : estadisticas.librosVendidos}
            </Text>
          </Text>
          <Text style={styles.sellerStat}>
            Libros comprados:{" "}
            <Text style={{ fontWeight: "bold" }}>
              {loadingEstadisticas ? "..." : estadisticas.librosComprados}
            </Text>
          </Text>
          <Text style={[styles.sellerStat, { fontWeight: "bold" }]}>
            Puntuacion de vendedor:{" "}
            {loadingEstadisticas
              ? "..."
              : `${estadisticas.puntuacionVendedor.toFixed(1)}⭐`}
            {estadisticas.cantidadValoraciones > 0 && (
              <Text style={{ fontSize: 12, color: "#7c4a2d" }}>
                {" "}
                ({estadisticas.cantidadValoraciones} valoraciones)
              </Text>
            )}
          </Text>
        </View>
      </ScrollView>
      <CustomTabBar
        activeTab="perfil"
        onTabPress={(tab) => {
          if (tab === "home") router.replace("/home");
          else if (tab === "market") router.replace("/market");
          else if (tab === "perfil") router.replace("/perfil");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 18,
    marginRight: 18,
  },
  topButton: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  topButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: 18,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FFF4E4",
    marginBottom: 8,
    backgroundColor: "#FFF4E4",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 2,
  },
  profileGenre: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
  profileBooks: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#3B2412",
  },
  sectionButton: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  sectionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  booksRowCentered: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginHorizontal: 18,
    marginBottom: 10,
    marginTop: 6,
  },
  bookCoverPlaceholder: {
    width: 90,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#FFF4E4",
    borderWidth: 1.5,
    borderColor: "#e0d3c2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  booksRowLeft: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 14,
    marginHorizontal: 18,
    marginBottom: 10,
    marginTop: 6,
  },
  sellerSection: {
    backgroundColor: "#FFF4E4",
    borderRadius: 16,
    marginHorizontal: 18,
    marginTop: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  sellerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 8,
  },
  sellerStat: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
  chipLecturaPerfil: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    transform: [{ translateX: -45 }],
    backgroundColor: "#3B2412",
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    minWidth: 90,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  chipLecturaPerfilText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
});
