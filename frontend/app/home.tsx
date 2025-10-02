import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Image,
  Platform,
} from "react-native";
import CustomTabBar from "../components/CustomTabBar";
import HeaderHome from "../components/HeaderHome";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../constants/ApiConfig";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../contexts/UserContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IS_LARGE_SCREEN = SCREEN_WIDTH > 768;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // Estados para los libros de cada sección
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [exploreBooks, setExploreBooks] = useState<any[]>([]);
  const [localSales, setLocalSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocalSales, setLoadingLocalSales] = useState(false);
  const [recommendationStrategy, setRecommendationStrategy] =
    useState<string>("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        // Verificar que el usuario esté logueado
        if (!user?.id) {
          console.log("[Home] Usuario no logueado, saltando recomendaciones");
          setLoading(false);
          return;
        }

        const userId = user.id;
        console.log(`[Home] Obteniendo recomendaciones para usuario ${userId}`);

        const response = await axios.get(
          `${API_BASE_URL}/api/recommendations/home`,
          {
            params: { userId },
          }
        );

        console.log(`[Home] Recomendaciones recibidas:`, response.data);
        console.log(
          `[Home] Primer libro tePodrianGustar:`,
          response.data.tePodrianGustar?.[0]
        );
        console.log(
          `[Home] Primer libro descubriNuevasLecturas:`,
          response.data.descubriNuevasLecturas?.[0]
        );

        if (
          response.data.tePodrianGustar &&
          response.data.descubriNuevasLecturas
        ) {
          setRecommendedBooks(response.data.tePodrianGustar);
          setExploreBooks(response.data.descubriNuevasLecturas);
          setRecommendationStrategy(
            response.data.metadata?.strategy || "unknown"
          );
          console.log(
            `[Home] Cargados: ${response.data.tePodrianGustar.length} + ${response.data.descubriNuevasLecturas.length} libros`
          );
          console.log(
            `[Home] Estrategia: ${
              response.data.metadata?.strategy || "unknown"
            }`
          );
        } else {
          console.error("[Home] Error: Respuesta de recomendaciones inválida");
          // Si falla, mostrar arrays vacíos
          setRecommendedBooks([]);
          setExploreBooks([]);
        }
      } catch (error) {
        console.error("[Home] Error obteniendo recomendaciones:", error);
        // Si falla, mostrar arrays vacíos
        setRecommendedBooks([]);
        setExploreBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?.id]);

  // Función para obtener publicaciones locales
  const fetchLocalSales = async () => {
    try {
      setLoadingLocalSales(true);

      if (!user?.id) {
        console.log(
          "[Home] Usuario no logueado, saltando publicaciones locales"
        );
        return;
      }

      const userId = user.id;
      console.log(
        `[Home] Obteniendo publicaciones locales para usuario ${userId}`
      );

      const response = await axios.get(
        `${API_BASE_URL}/api/recommendations/local-sales?userId=${userId}`
      );

      if (response.data && response.data.publicaciones) {
        setLocalSales(response.data.publicaciones);
        console.log(
          `[Home] Publicaciones locales cargadas: ${response.data.publicaciones.length} en ${response.data.ubicacion}`
        );
      } else {
        console.error(
          "[Home] Error: Respuesta de publicaciones locales inválida"
        );
        setLocalSales([]);
      }
    } catch (error) {
      console.error("[Home] Error obteniendo publicaciones locales:", error);
      setLocalSales([]);
    } finally {
      setLoadingLocalSales(false);
    }
  };

  // Cargar publicaciones locales cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      fetchLocalSales();
    }
  }, [user?.id]);

  const handleSearch = (text: string) => {
    // Aquí puedes implementar la lógica de búsqueda
    // (ya no es necesario para Google Books, pero se deja para filtros futuros)
  };

  const handleFilterChange = (filter: string | null) => {
    // El filtro se maneja en el HeaderHome
    console.log("Filtro seleccionado:", filter);
  };

  const handleBookSelect = (book: any) => {
    router.push({
      pathname: "/libro/[id]",
      params: {
        id: book.volumeId || book.id, // Usar volumeId del nuevo sistema
        title: book.title,
        authors: Array.isArray(book.authors)
          ? book.authors.join(", ")
          : book.authors || "",
        publisher: book.publisher || "",
        publishedDate: book.publishedDate || "",
        description: book.description || "",
        pageCount: book.pageCount || "",
        categories: Array.isArray(book.categories)
          ? book.categories.join(", ")
          : book.categories || "",
        language: book.language || "",
        image: book.image || "",
        descriptionGenerated: book.descriptionGenerated || false,
        reason: book.reason || "", // Nueva propiedad del sistema de recomendaciones
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: 0 }]}>
      <HeaderHome
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onBookSelect={handleBookSelect}
      />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Contenido principal */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom: 150, // Espacio suficiente para el botón flotante y TabBar
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>
              Te podría gustar
              {recommendationStrategy && (
                <Text style={styles.strategyIndicator}>
                  {" "}
                  ({recommendationStrategy})
                </Text>
              )}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.booksScrollContainer}
              style={styles.booksScrollView}
            >
              {loading ? (
                <Text>Cargando...</Text>
              ) : (
                recommendedBooks.map((book, index) => {
                  console.log(`[Home] Renderizando libro ${index}:`, book);
                  return (
                    <TouchableOpacity
                      key={`recommended-${book.volumeId || book.id}`}
                      onPress={() => handleBookSelect(book)}
                      style={styles.bookItem}
                    >
                      <View
                        style={{
                          width: 90,
                          height: 130,
                          borderRadius: 10,
                          overflow: "hidden",
                          backgroundColor: "#f3e8da",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        {book.image && !book.image.includes("placehold.co") ? (
                          <Image
                            source={{ uri: book.image }}
                            accessibilityLabel={book.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              resizeMode: "cover",
                            }}
                          />
                        ) : (
                          <View
                            style={{
                              width: "100%",
                              height: "100%",
                              backgroundColor: "#e0e0e0",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                textAlign: "center",
                                color: "#666",
                                padding: 4,
                              }}
                              numberOfLines={2}
                            >
                              {book.title}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Explora nuevas lecturas</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.booksScrollContainer}
              style={styles.booksScrollView}
            >
              {loading ? (
                <Text>Cargando...</Text>
              ) : (
                exploreBooks.map((book) => (
                  <TouchableOpacity
                    key={`explore-${book.volumeId || book.id}`}
                    onPress={() => handleBookSelect(book)}
                    style={styles.bookItem}
                  >
                    <View
                      style={{
                        width: 90,
                        height: 130,
                        borderRadius: 10,
                        overflow: "hidden",
                        backgroundColor: "#f3e8da",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      {book.image && !book.image.includes("placehold.co") ? (
                        <Image
                          source={{ uri: book.image }}
                          accessibilityLabel={book.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            resizeMode: "cover",
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#e0e0e0",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              textAlign: "center",
                              color: "#666",
                              padding: 4,
                            }}
                            numberOfLines={2}
                          >
                            {book.title}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
          <View style={[styles.sectionBox, styles.localSalesSection]}>
            <Text style={styles.sectionTitle}>En venta cerca tuyo</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.localSalesScrollContainer}
              style={styles.localSalesScrollView}
            >
              {loadingLocalSales ? (
                <View style={styles.loadingContainer}>
                  <Text>Cargando publicaciones locales...</Text>
                </View>
              ) : localSales.length > 0 ? (
                localSales.slice(0, 20).map((publicacion) => (
                  <TouchableOpacity
                    key={`local-sale-${publicacion.id}`}
                    onPress={() =>
                      router.push({
                        pathname: "/publicacion/[id]",
                        params: { id: publicacion.id.toString() },
                      })
                    }
                    style={styles.localBookCard}
                  >
                    {publicacion.portada ? (
                      <Image
                        source={{
                          uri: `${API_BASE_URL}${publicacion.portada}`,
                        }}
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
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No hay publicaciones en venta en tu ciudad
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
      {/* Botón flotante de recomendaciones */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.replace("/chat" as any)}
      >
        <Text style={styles.fabText}>Recomendaciones inteligentes 📚</Text>
      </TouchableOpacity>
      <CustomTabBar
        activeTab="home"
        onTabPress={(tab) => {
          if (tab === "home") return;
          if (tab === "market") router.replace("/market");
          if (tab === "perfil") router.replace("/perfil");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF4E4",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    width: "100%",
    minHeight: "100%",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: "4%",
    backgroundColor: "#FFF",
    width: "100%",
    marginTop: 0,
  },
  sectionBox: {
    backgroundColor: "#FFF4E4",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 18,
    marginTop: 18,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: SCREEN_WIDTH < 350 ? 14 : 17,
    fontWeight: "bold",
    color: "#7c4a2d",
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  booksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
    minHeight: 80,
    alignItems: "center",
    width: "100%",
  },
  booksScrollView: {
    marginBottom: 10,
    minHeight: 150,
  },
  booksScrollContainer: {
    alignItems: "center",
    justifyContent: IS_LARGE_SCREEN ? "center" : "flex-start",
    paddingHorizontal: IS_LARGE_SCREEN ? 16 : 8,
    gap: 12,
    minWidth: IS_LARGE_SCREEN ? "100%" : "auto",
  },
  bookItem: {
    marginRight: 8,
    marginBottom: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 90,
    backgroundColor: "#332018",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 12,
    zIndex: 20,
  },
  fabText: {
    color: "#f3e8da",
    fontWeight: "bold",
    fontSize: 15,
  },
  strategyIndicator: {
    fontSize: 12,
    color: "#999",
    fontWeight: "normal",
  },
  bookPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2e7d32",
    marginTop: 2,
  },
  bookLocation: {
    fontSize: 10,
    color: "#666",
    marginTop: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  localSalesSection: {
    marginBottom: 80, // Margen extra para separar del botón flotante y tabbar
  },
  localSalesScrollView: {
    marginBottom: 10,
    minHeight: 200,
    ...(Platform.OS === "web" && {
      minHeight: 280,
    }),
  },
  localSalesScrollContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 8,
    gap: 12,
  },
  localBookCard: {
    width: 150,
    height: 190,
    backgroundColor: "#fff4e4",
    borderRadius: 18,
    marginRight: 12,
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
      width: 180,
      height: 240,
      marginRight: 16,
    }),
  },
  // Estilos del marketplace
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 18,
    paddingHorizontal: 6,
  },
  bookCard: {
    width: "44%",
    minWidth: 150,
    maxWidth: 220,
    height: 190,
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
