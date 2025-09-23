import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import HeaderMarketplace from "../components/HeaderMarketplace";
import CustomTabBar from "../components/CustomTabBar";
import { useRouter } from "expo-router";
import { usePublicaciones } from "../hooks/usePublicaciones";
import { API_BASE_URL } from "../constants/ApiConfig";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MarketScreen() {
  const router = useRouter();
  const { publicaciones, loading, error } = usePublicaciones();
  const [searchText, setSearchText] = useState("");

  // Filtrar publicaciones según el texto de búsqueda
  const filteredPublicaciones = useMemo(() => {
    if (!searchText.trim()) {
      return publicaciones;
    }

    const searchLower = searchText.toLowerCase().trim();
    return publicaciones.filter((publicacion) => {
      const tituloMatch = publicacion.titulo
        ?.toLowerCase()
        .includes(searchLower);
      const autorMatch = publicacion.autor?.toLowerCase().includes(searchLower);
      const generoMatch = publicacion.genero
        ?.toLowerCase()
        .includes(searchLower);
      const editorialMatch = publicacion.editorial
        ?.toLowerCase()
        .includes(searchLower);

      return tituloMatch || autorMatch || generoMatch || editorialMatch;
    });
  }, [publicaciones, searchText]);

  const handleSearch = (text: string) => {
    setSearchText(text);
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
      <Text style={styles.bookTitle} numberOfLines={2}>
        {publicacion.titulo}
      </Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>
        {publicacion.autor}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeaderMarketplace onSearch={handleSearch} />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
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
          {searchText.trim()
            ? `Resultados para "${searchText}" (${filteredPublicaciones.length})`
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
            {filteredPublicaciones.length > 0 ? (
              filteredPublicaciones.map(renderPublicacion)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchText.trim()
                    ? `No se encontraron publicaciones para "${searchText}"`
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
    </View>
  );
}

const CARD_GAP = 18;
const CARD_WIDTH_PERCENT = Platform.OS === "web" ? "22%" : "44%";
const CARD_HEIGHT = 170;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 18,
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
    fontSize: 17,
    fontWeight: "bold",
    color: "#3B2412",
    marginTop: 24,
    marginBottom: 12,
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
  bookImage: {
    width: "100%",
    height: 110,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3B2412",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 8,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: "#7c4a2d",
    textAlign: "center",
    marginTop: 2,
    marginHorizontal: 8,
    fontStyle: "italic",
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
