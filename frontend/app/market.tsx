import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import HeaderMarketplace from "../components/HeaderMarketplace";
import CustomTabBar from "../components/CustomTabBar";
import FiltrosMarketplace, {
  FiltrosState,
} from "../components/FiltrosMarketplace";
import { useRouter } from "expo-router";
import { usePublicaciones } from "../hooks/usePublicaciones";
import { API_BASE_URL } from "../constants/ApiConfig";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MarketScreen() {
  const router = useRouter();
  const {
    publicaciones: publicacionesBase,
    loading: loadingBase,
    error: errorBase,
  } = usePublicaciones();
  const [searchText, setSearchText] = useState("");
  const [publicaciones, setPublicaciones] = useState(publicacionesBase);
  const [loading, setLoading] = useState(loadingBase);
  const [error, setError] = useState(errorBase);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>({
    tipoBusqueda: "titulo",
    estadosLibro: [],
    ubicacion: "",
  });

  // Actualizar publicaciones cuando cambien los datos base
  useEffect(() => {
    setPublicaciones(publicacionesBase);
    setLoading(loadingBase);
    setError(errorBase);
  }, [publicacionesBase, loadingBase, errorBase]);

  // Función para buscar con filtros
  const buscarConFiltros = async (
    texto: string,
    filtrosAplicar?: FiltrosState
  ) => {
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      const params = new URLSearchParams();
      const filtrosFinales = filtrosAplicar || filtros;

      // Agregar búsqueda según el tipo seleccionado
      if (texto.trim()) {
        if (filtrosFinales.tipoBusqueda === "titulo") {
          params.append("titulo", texto.trim());
        } else if (filtrosFinales.tipoBusqueda === "autor") {
          params.append("autor", texto.trim());
        } else {
          // Búsqueda general
          params.append("search", texto.trim());
        }
      }

      // Agregar filtros adicionales
      if (
        filtrosFinales.estadosLibro &&
        filtrosFinales.estadosLibro.length > 0
      ) {
        // Agregar cada estado como un parámetro separado
        filtrosFinales.estadosLibro.forEach((estado) => {
          params.append("estadoLibro", estado);
        });
      }
      if (filtrosFinales.ubicacion) {
        params.append("ubicacion", filtrosFinales.ubicacion);
      }

      const response = await axios.get(
        `${API_BASE_URL}/publicaciones?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPublicaciones(response.data);
      setError(null);
    } catch (error) {
      console.error("Error al buscar con filtros:", error);
      setError("Error al cargar publicaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    buscarConFiltros(text);
  };

  const handleFiltrosPress = () => {
    setMostrarFiltros(true);
  };

  const handleAplicarFiltros = (nuevosFiltros: FiltrosState) => {
    setFiltros(nuevosFiltros);
    buscarConFiltros(searchText, nuevosFiltros);
  };

  const renderPublicacion = (publicacion: any) => (
    <TouchableOpacity
      key={publicacion.id}
      style={styles.bookCard}
      onPress={() =>
        router.push({
          pathname: "/publicacion/[id]",
          params: { id: publicacion.id.toString() },
        })
      }
    >
      {publicacion.imagenUrl ? (
        <Image
          source={{ uri: `${API_BASE_URL}${publicacion.imagenUrl}` }}
          style={styles.bookImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}
      <View style={styles.priceTagShadow}>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>
            ${publicacion.precio.toLocaleString("es-ES")}
          </Text>
        </View>
      </View>
      <Text style={styles.bookTitle} numberOfLines={1}>
        {publicacion.titulo}
      </Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>
        {publicacion.autor}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeaderMarketplace
        onSearch={handleSearch}
        onFiltrosPress={handleFiltrosPress}
      />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: Platform.OS === "android" ? 100 : 20,
        }}
      >
        {/* Botones superiores */}
        <View style={styles.topButtonsRow}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.replace("/mis-publicaciones")}
          >
            <Text style={styles.topButtonText}>Tus publicaciones</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.replace("/historial-compras")}
          >
            <Text style={styles.topButtonText}>Historial de compras</Text>
          </TouchableOpacity>
        </View>

        {/* Título */}
        <Text style={styles.sectionTitle}>
          {publicaciones.length !== publicacionesBase.length
            ? `Resultados de búsqueda (${publicaciones.length})`
            : "Encuentra tu siguiente libro"}
        </Text>

        {/* Estado de carga */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B2412" />
            <Text style={styles.loadingText}>Cargando publicaciones...</Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Grilla de publicaciones */}
        {!loading && !error && (
          <View style={styles.grid}>
            {publicaciones.length > 0 ? (
              publicaciones.map(renderPublicacion)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {publicaciones.length !== publicacionesBase.length
                    ? "No se encontraron publicaciones con los filtros aplicados"
                    : "No hay publicaciones disponibles"}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <CustomTabBar
        activeTab="market"
        onTabPress={(tab) => {
          if (tab === "home") router.replace("/home");
          else if (tab === "market") router.replace("/market");
          else if (tab === "perfil") router.replace("/perfil");
        }}
      />

      {/* Modal de Filtros */}
      <FiltrosMarketplace
        visible={mostrarFiltros}
        onClose={() => setMostrarFiltros(false)}
        onAplicarFiltros={handleAplicarFiltros}
        filtrosActuales={filtros}
      />
    </View>
  );
}

const CARD_GAP = 18;
const CARD_WIDTH_PERCENT = Platform.OS === "web" ? "22%" : "44%";
const CARD_HEIGHT = 190;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
    marginHorizontal: 18,
  },
  topButton: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 140,
    alignItems: "center",
  },
  topButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
    marginTop: 20,
    marginBottom: 16,
    marginLeft: 18,
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
    minWidth: 150,
    maxWidth: 220,
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
    paddingHorizontal: 8,
    ...(Platform.OS === "web" && {
      minWidth: 180,
      maxWidth: 250,
      height: 240,
    }),
  },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#e9e3de",
    ...(Platform.OS === "web" && {
      height: 140,
    }),
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
  bookImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    ...(Platform.OS === "web" && {
      height: 140,
    }),
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3B2412",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 4,
    lineHeight: 18,
    height: 20,
    justifyContent: "center",
    ...(Platform.OS === "web" && {
      fontSize: 16,
      height: 24,
      lineHeight: 20,
    }),
  },
  bookAuthor: {
    fontSize: 12,
    color: "#7c4a2d",
    textAlign: "center",
    marginTop: 6,
    marginHorizontal: 4,
    fontStyle: "italic",
    height: 18,
    ...(Platform.OS === "web" && {
      fontSize: 15,
      height: 24,
      marginTop: 10,
      lineHeight: 18,
      fontWeight: "500",
    }),
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#3B2412",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    width: "100%",
  },
  emptyText: {
    fontSize: 16,
    color: "#7c4a2d",
    textAlign: "center",
  },
});
