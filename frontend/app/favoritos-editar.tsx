import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../contexts/UserContext";
import { Image as ExpoImage } from "expo-image";
import axios from "axios";
import { API_BASE_URL } from "../constants/ApiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getPlaceholderImage,
  getOptimizedImageConfig,
} from "../utils/imageUtils";

export default function FavoritosEditar() {
  const router = useRouter();
  const { user, removeFavorite } = useUser();
  const [lecturas, setLecturas] = useState<any[]>([]);

  useEffect(() => {
    const fetchLecturas = async () => {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/lecturas/mias`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setLecturas(res.data);
    };
    fetchLecturas();
  }, []);

  const handleDeleteFavorite = (index: number) => {
    const libro = (user as any)?.librosFavoritos?.[index];
    if (!libro || !removeFavorite) return;

    const confirmDelete = () => {
      removeFavorite(index);
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          `¿Estás seguro de que quieres eliminar "${libro.titulo}" de tus favoritos?`
        )
      ) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Eliminar favorito",
        `¿Estás seguro de que quieres eliminar "${libro.titulo}" de tus favoritos?`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.volverBtn}
          onPress={() => router.replace("/perfil")}
        >
          <Text style={styles.volverBtnText}>Volver al perfil</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.titulo}>Tus 3 libros favoritos</Text>
      <View style={styles.booksRowCentered}>
        {[0, 1, 2].map((idx) => {
          const libro = (user as any)?.librosFavoritos?.[idx] ?? null;
          return (
            <View key={idx} style={styles.bookContainer}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/favoritos-buscar",
                    params: { slot: idx },
                  } as any)
                }
              >
                {libro && libro.portada ? (
                  <ExpoImage
                    source={{
                      uri: libro.portada || getPlaceholderImage(90, 130),
                    }}
                    style={styles.bookCover}
                    placeholder={getPlaceholderImage(90, 130)}
                    {...getOptimizedImageConfig()}
                  />
                ) : (
                  <View style={styles.bookCover} />
                )}
              </TouchableOpacity>
              {libro && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteFavorite(idx)}
                >
                  <View style={styles.deleteIconContainer}>
                    <View style={styles.deleteIconTop} />
                    <View style={styles.deleteIconBody} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
      <Text style={styles.subtitulo}>Seleccioná uno para cambiarlo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 38 : 18,
    paddingBottom: 8,
    backgroundColor: "#FFF4E4",
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
  },
  volverBtn: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  volverBtnText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 15,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    textAlign: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  booksRowCentered: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    gap: 18,
  },
  bookContainer: {
    position: "relative",
  },
  bookCover: {
    width: 100,
    height: 145,
    borderRadius: 12,
    backgroundColor: "#FFF4E4",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  deleteButton: {
    position: "absolute",
    top: -8,
    right: 0,
    backgroundColor: "#666666",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  deleteIconContainer: {
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconTop: {
    width: 8,
    height: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 0.5,
    marginBottom: 1,
  },
  deleteIconBody: {
    width: 10,
    height: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  subtitulo: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginTop: 18,
    fontWeight: "500",
  },
});
