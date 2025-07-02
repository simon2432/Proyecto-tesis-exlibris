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
import { useRouter } from "expo-router";
import { useUser } from "../contexts/UserContext";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { API_BASE_URL } from "../constants/ApiConfig";

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

  useEffect(() => {
    // Precargar imágenes comunes
    preloadImages();

    // Obtener lecturas del usuario
    const fetchLecturas = async () => {
      try {
        const token = await (window && window.localStorage
          ? window.localStorage.getItem("token")
          : null);
        const res = await axios.get(`${API_BASE_URL}/lecturas/mias`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setLecturas(res.data);

        // Las portadas ya vienen del backend
        const portadasObj: { [key: string]: string } = {};
        res.data.forEach((lectura: any) => {
          portadasObj[lectura.id] =
            lectura.portada || "https://placehold.co/90x120";
        });
        setPortadas(portadasObj);
      } catch {}
    };
    fetchLecturas();
  }, []);

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
      const token = await (window && window.localStorage
        ? window.localStorage.getItem("token")
        : null);
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

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <HeaderPerfil />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={styles.topButtonsRow}>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonText}>Agregar lectura</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonText}>Ver logros</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
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
            {uploading && (
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.6)",
                  borderRadius: 45,
                }}
              >
                <ActivityIndicator size="large" color="#7c4a2d" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName}>{user?.nombre || "Usuario"}</Text>
          <Text style={styles.profileGenre}>
            Género más leído:{" "}
            <Text style={{ fontWeight: "bold" }}>Ciencia ficción</Text>
          </Text>
          <Text style={styles.profileBooks}>
            Libros leídos: <Text style={{ fontWeight: "bold" }}>244</Text>
          </Text>
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Tus 3 libros favoritos</Text>
          <TouchableOpacity style={styles.sectionButton}>
            <Text style={styles.sectionButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.booksRowCentered}>
          <View style={styles.bookCoverPlaceholder} />
          <View style={styles.bookCoverPlaceholder} />
          <View style={styles.bookCoverPlaceholder} />
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Historial lector</Text>
          <TouchableOpacity style={styles.sectionButton}>
            <Text style={styles.sectionButtonText}>Ver historial</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.booksRowLeft}>
          {lecturas.length === 0 ? (
            <Text
              style={{ color: "#a08b7d", fontStyle: "italic", marginLeft: 8 }}
            >
              No tienes lecturas aún.
            </Text>
          ) : (
            lecturas.map((lectura) => (
              <TouchableOpacity
                key={lectura.id}
                onPress={() =>
                  router.push({
                    pathname: "/lectura-historial/[id]" as any,
                    params: { id: lectura.id },
                  })
                }
                style={{ marginRight: 10 }}
              >
                <ExpoImage
                  source={{
                    uri: portadas[lectura.id] || "https://placehold.co/90x120",
                  }}
                  style={styles.bookCoverPlaceholder}
                  placeholder="https://placehold.co/90x120"
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
        <View style={styles.sellerSection}>
          <Text style={styles.sellerTitle}>Perfil vendedor</Text>
          <Text style={styles.sellerStat}>
            Libros vendidos: <Text style={{ fontWeight: "bold" }}>4</Text>
          </Text>
          <Text style={styles.sellerStat}>
            Libros comprados: <Text style={{ fontWeight: "bold" }}>11</Text>
          </Text>
          <Text style={[styles.sellerStat, { fontWeight: "bold" }]}>
            Puntuacion de vendedor: 4.5⭐
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
});
