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
  const [loading, setLoading] = useState(true);
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
  }, [user?.id]); // Se ejecuta cuando cambia el usuario

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
            paddingBottom: 100, // Espacio suficiente para el TabBar
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
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>En venta cerca tuyo</Text>
            <View style={styles.booksRow}>{/* Aquí irán los libros */}</View>
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
});
