import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../../constants/ApiConfig";
import { Image as ExpoImage } from "expo-image";
import {
  getPlaceholderImage,
  getOptimizedImageConfig,
} from "../../utils/imageUtils";

const { width } = Dimensions.get("window");
const COVER_SIZE = Platform.OS === "web" ? width / 4 - 16 : width / 3 - 16;

export default function HistorialLectorExtendido() {
  const router = useRouter();
  const [lecturas, setLecturas] = useState<any[]>([]);
  const [portadas, setPortadas] = useState<{ [key: string]: string }>({});
  const [errorLecturas, setErrorLecturas] = useState<string | null>(null);

  useEffect(() => {
    const fetchLecturas = async () => {
      try {
        setErrorLecturas(null);
        const token = await AsyncStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/lecturas/mias`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 5000,
        });
        setLecturas(res.data);
        const portadasObj: { [key: string]: string } = {};
        res.data.forEach((lectura: any) => {
          portadasObj[lectura.id] =
            lectura.portada || getPlaceholderImage(180, 250);
        });
        setPortadas(portadasObj);
      } catch (error) {
        setLecturas([]);
        setPortadas({});
        setErrorLecturas("No se pudo cargar el historial. Intenta más tarde.");
      }
    };
    fetchLecturas();
  }, []);

  // Ordenar igual que en perfil
  const lecturasOrdenadas = [...lecturas].sort((a, b) => {
    const aEnLectura = !a.fechaFin;
    const bEnLectura = !b.fechaFin;
    if (aEnLectura && !bEnLectura) return -1;
    if (!aEnLectura && bEnLectura) return 1;
    if (aEnLectura && bEnLectura) {
      return (
        new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
      );
    }
    return new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime();
  });

  // Agrupar en filas de 3
  const filas = [];
  for (let i = 0; i < lecturasOrdenadas.length; i += 3) {
    filas.push(lecturasOrdenadas.slice(i, i + 3));
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.volverBtn}
          onPress={() => router.replace("/perfil")}
        >
          <Text style={styles.volverBtnText}>Volver al perfil</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Historial lector</Text>
        <TouchableOpacity style={styles.filtrosBtn}>
          <Text style={styles.filtrosBtnText}>Filtros</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {errorLecturas ? (
          <Text
            style={{
              color: "#a08b7d",
              fontStyle: "italic",
              textAlign: "center",
              marginTop: 30,
            }}
          >
            {errorLecturas}
          </Text>
        ) : (
          filas.map((fila, idx) => (
            <View key={idx} style={styles.row}>
              {fila.map((lectura) => (
                <TouchableOpacity
                  key={lectura.id}
                  onPress={() =>
                    router.push({
                      pathname: "/lectura-historial/[id]",
                      params: { id: lectura.id },
                    })
                  }
                  style={styles.coverWrapper}
                >
                  <ExpoImage
                    source={{
                      uri: lectura.portada || getPlaceholderImage(180, 250),
                    }}
                    style={styles.cover}
                    placeholder={getPlaceholderImage(180, 250)}
                    {...getOptimizedImageConfig()}
                    onError={() => {
                      setPortadas((prev) => {
                        if (
                          prev[lectura.id] &&
                          prev[lectura.id] !== getPlaceholderImage(180, 250)
                        ) {
                          return prev;
                        }
                        return {
                          ...prev,
                          [lectura.id]: getPlaceholderImage(180, 250),
                        };
                      });
                    }}
                  />
                  {!lectura.fechaFin && (
                    <View style={styles.chipLectura}>
                      <Text style={styles.chipLecturaText}>En lectura</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {/* Si la fila tiene menos de 3, agregar espacios vacíos */}
              {fila.length < 3 &&
                Array.from({ length: 3 - fila.length }).map((_, i) => (
                  <View key={"empty-" + i} style={styles.coverWrapper} />
                ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    flex: 1,
  },
  filtrosBtn: {
    backgroundColor: "#332018",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginLeft: 8,
  },
  filtrosBtnText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 15,
  },
  scrollContent: {
    padding: Platform.OS === "web" ? 4 : 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 18,
  },
  coverWrapper: {
    width: COVER_SIZE,
    height: COVER_SIZE * 1.45,
    borderRadius: 16,
    backgroundColor: "#FFF4E4",
    marginHorizontal: Platform.OS === "web" ? 6 : 6,
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  cover: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#FFF4E4",
  },
  chipLectura: {
    position: "absolute",
    bottom: 10,
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
  chipLecturaText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
});
