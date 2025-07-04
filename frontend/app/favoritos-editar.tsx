import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../contexts/UserContext";
import { Image as ExpoImage } from "expo-image";
import axios from "axios";
import { API_BASE_URL } from "../constants/ApiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function FavoritosEditar() {
  const router = useRouter();
  const { user } = useUser();
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
            <TouchableOpacity
              key={idx}
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
                    uri: libro.portada || "https://placehold.co/90x120",
                  }}
                  style={styles.bookCover}
                  placeholder="https://placehold.co/90x120"
                  contentFit="cover"
                  transition={100}
                />
              ) : (
                <View style={styles.bookCover} />
              )}
            </TouchableOpacity>
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
  bookCover: {
    width: 90,
    height: 130,
    borderRadius: 12,
    backgroundColor: "#FFF4E4",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  subtitulo: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginTop: 18,
    fontWeight: "500",
  },
});
