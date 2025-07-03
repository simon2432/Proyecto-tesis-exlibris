import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Estados para los libros de cada sección
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [exploreBooks, setExploreBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Palabras random para buscar
  const randomWords = [
    "amor",
    "historia",
    "aventura",
    "vida",
    "misterio",
    "fantasía",
    "clásico",
    "familia",
    "viaje",
    "secreto",
  ];

  useEffect(() => {
    // Elegir dos palabras random distintas
    const getTwoRandomWords = () => {
      const shuffled = randomWords.sort(() => 0.5 - Math.random());
      return [shuffled[0], shuffled[1]];
    };
    const [word1, word2] = getTwoRandomWords();

    const fetchBooks = async (word: string) => {
      try {
        const res = await axios.get(`${API_BASE_URL}/books/search`, {
          params: { q: word },
        });
        return res.data.books || [];
      } catch {
        return [];
      }
    };

    setLoading(true);
    Promise.all([fetchBooks(word1), fetchBooks(word2)]).then(
      ([books1, books2]) => {
        setRecommendedBooks(books1.slice(0, 10));
        setExploreBooks(books2.slice(0, 10));
        setLoading(false);
      }
    );
  }, []);

  const handleSearch = (text: string) => {
    // Aquí puedes implementar la lógica de búsqueda
    // (ya no es necesario para Google Books, pero se deja para filtros futuros)
  };

  const handleFilterChange = (filters: {
    libro: boolean;
    autor: boolean;
    genero: boolean;
  }) => {
    // Aquí puedes implementar la lógica de filtros
  };

  const handleBookSelect = (book: any) => {
    router.push({
      pathname: "/libro/[id]",
      params: {
        id: book.id,
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
            <Text style={styles.sectionTitle}>Te podría gustar</Text>
            <View style={styles.booksRow}>
              {loading ? (
                <Text>Cargando...</Text>
              ) : (
                recommendedBooks.map((book) => (
                  <TouchableOpacity
                    key={book.id}
                    onPress={() => handleBookSelect(book)}
                    style={{ marginRight: 8, marginBottom: 8 }}
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
                      <Image
                        source={{ uri: book.image }}
                        accessibilityLabel={book.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          resizeMode: "cover",
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Explora nuevas lecturas</Text>
            <View style={styles.booksRow}>
              {loading ? (
                <Text>Cargando...</Text>
              ) : (
                exploreBooks.map((book) => (
                  <TouchableOpacity
                    key={book.id}
                    onPress={() => handleBookSelect(book)}
                    style={{ marginRight: 8, marginBottom: 8 }}
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
                      <Image
                        source={{ uri: book.image }}
                        accessibilityLabel={book.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          resizeMode: "cover",
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
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
});
