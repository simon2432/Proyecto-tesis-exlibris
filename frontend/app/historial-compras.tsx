import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/ApiConfig";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Compra {
  id: number;
  portada: string;
  titulo: string;
  vendedor: string;
  fecha: string;
  tipoEntrega: string;
  estado: string;
  precio: number;
}

export default function HistorialCompras() {
  const router = useRouter();
  const [tab, setTab] = useState("en-proceso");
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompras();
  }, []);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/compras/mis-compras`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Compras obtenidas:", data);
        setCompras(data);
      } else {
        console.error("Error obteniendo compras:", response.status);
        setCompras([]);
      }
    } catch (error) {
      console.error("Error en fetchCompras:", error);
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar compras según el tab
  const comprasEnProceso = compras.filter(
    (compra) =>
      compra.estado === "pago_pendiente" ||
      compra.estado === "encuentro" ||
      compra.estado === "envio_pendiente" ||
      compra.estado === "en_camino" ||
      compra.estado === "comprador_confirmado" ||
      compra.estado === "vendedor_confirmado"
  );

  const comprasCompletadas = compras.filter(
    (compra) => compra.estado === "completado"
  );

  // Colores para los estados
  const estadoColor = (estado: string) => {
    switch (estado) {
      case "pago_pendiente":
        return { backgroundColor: "#c6f6fa", color: "#3B2412" };
      case "encuentro":
        return { backgroundColor: "#ffb3d9", color: "#3B2412" };
      case "envio_pendiente":
        return { backgroundColor: "#e9d6fa", color: "#3B2412" };
      case "en_camino":
        return { backgroundColor: "#e9d6fa", color: "#3B2412" };
      case "completado":
        return { backgroundColor: "#c6fadc", color: "#3B2412" };
      default:
        return { backgroundColor: "#eee", color: "#3B2412" };
    }
  };

  // Mapear estados a texto legible
  const getEstadoText = (estado: string) => {
    switch (estado) {
      case "pago_pendiente":
        return "Pago pendiente";
      case "encuentro":
        return "Encuentro";
      case "envio_pendiente":
        return "Envío pendiente";
      case "en_camino":
        return "En camino";
      case "completado":
        return "Completado";
      default:
        return estado;
    }
  };

  const renderCompra = (compra: Compra) => (
    <TouchableOpacity
      key={compra.id}
      style={styles.bookCard}
      onPress={() =>
        router.push({
          pathname: "/compra/[id]",
          params: { id: compra.id.toString() },
        })
      }
      activeOpacity={0.8}
    >
      {compra.portada ? (
        <Image
          source={{ uri: `${API_BASE_URL}${compra.portada}` }}
          style={styles.imagePlaceholder}
        />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}
      <View style={styles.priceTagShadow}>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>
            ${compra.precio.toLocaleString("es-ES")}
          </Text>
        </View>
      </View>
      <Text style={styles.pubTitle} numberOfLines={2}>
        {compra.titulo}
      </Text>
      <Text style={styles.vendedorText} numberOfLines={1}>
        {compra.vendedor}
      </Text>
      <View style={[styles.estadoTag, estadoColor(compra.estado)]}>
        <Text style={styles.estadoText}>{getEstadoText(compra.estado)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../assets/images/logoLechuza.png")}
            style={styles.logoImg}
          />
        </View>
        <View style={styles.topButtonsRow}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.replace("/market")}
          >
            <Text style={styles.topButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B2412" />
          <Text style={styles.loadingText}>Cargando compras...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header solo logo a la izquierda y color principal */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/logoLechuza.png")}
          style={styles.logoImg}
        />
      </View>
      {/* Botones debajo del header, alineados a los extremos */}
      <View style={styles.topButtonsRow}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => router.replace("/market")}
        >
          <Text style={styles.topButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>
          {tab === "en-proceso" ? "Compras en proceso" : "Compras completadas"}
        </Text>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "en-proceso" && styles.tabBtnActive]}
            onPress={() => setTab("en-proceso")}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === "en-proceso" && styles.tabBtnTextActive,
              ]}
            >
              En proceso
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              tab === "completadas" && styles.tabBtnActive,
            ]}
            onPress={() => setTab("completadas")}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === "completadas" && styles.tabBtnTextActive,
              ]}
            >
              Completadas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido según el tab */}
        {tab === "en-proceso" && (
          <View style={styles.grid}>
            {comprasEnProceso.length > 0 ? (
              comprasEnProceso.map(renderCompra)
            ) : (
              <Text style={styles.emptyText}>
                No tienes compras en proceso.
              </Text>
            )}
          </View>
        )}

        {tab === "completadas" && (
          <View style={styles.grid}>
            {comprasCompletadas.length > 0 ? (
              comprasCompletadas.map(renderCompra)
            ) : (
              <Text style={styles.emptyText}>
                No tienes compras completadas.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const CARD_GAP = 18;
const CARD_WIDTH_PERCENT = Platform.OS === "web" ? "29%" : "28%";
const CARD_HEIGHT = 200;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff4e4",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 18,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  logoImg: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 8,
    marginHorizontal: 18,
  },
  topButton: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 120,
    alignItems: "center",
  },
  topButtonText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 15,
  },
  title: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
    marginTop: 18,
    marginBottom: 18,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 18,
  },
  tabBtn: {
    backgroundColor: "#f3e8da",
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 7,
  },
  tabBtnActive: {
    backgroundColor: "#3B2412",
  },
  tabBtnText: {
    color: "#3B2412",
    fontWeight: "bold",
    fontSize: 15,
  },
  tabBtnTextActive: {
    color: "#fff4e4",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: CARD_GAP,
    paddingHorizontal: 6,
  },
  bookCard: {
    width: CARD_WIDTH_PERCENT,
    minWidth: 90,
    maxWidth: 140,
    height: CARD_HEIGHT,
    backgroundColor: "#fff4e4",
    borderRadius: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 110,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#e9e3de",
  },
  priceTagShadow: {
    marginTop: -18,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 12,
  },
  priceTag: {
    backgroundColor: "#f3e8da",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 6,
    minWidth: 80,
    alignItems: "center",
  },
  priceText: {
    color: "#7c4a2d",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  pubTitle: {
    fontSize: 14,
    color: "#3B2412",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  vendedorText: {
    fontSize: 12,
    color: "#7c4a2d",
    textAlign: "center",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  estadoTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyText: {
    color: "#a08b7d",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 30,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#3B2412",
  },
});
