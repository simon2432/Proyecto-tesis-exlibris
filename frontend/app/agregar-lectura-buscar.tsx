import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../constants/ApiConfig";
import { Image as ExpoImage } from "expo-image";

const { width } = Dimensions.get("window");
const COVER_SIZE = Platform.OS === "web" ? width / 6 - 24 : width / 3 - 24;

export default function AgregarLecturaBuscar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/books/search`, {
        params: { q: query },
      });
      setBooks(res.data.books || []);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar en filas de 3
  const filas = [];
  for (let i = 0; i < books.length; i += 3) {
    filas.push(books.slice(i, i + 3));
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/perfil")}
        >
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar libro..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#7c4a2d"
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filas.map((fila, idx) => (
            <View key={idx} style={styles.row}>
              {fila.map((book) => (
                <TouchableOpacity
                  key={book.id}
                  style={styles.coverWrapper}
                  onPress={() => {
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
                        descriptionGenerated:
                          book.descriptionGenerated || false,
                      },
                    } as any);
                  }}
                >
                  <ExpoImage
                    source={{
                      uri: book.image || "https://placehold.co/90x120",
                    }}
                    style={styles.cover}
                    placeholder="https://placehold.co/90x120"
                    contentFit="cover"
                    transition={100}
                  />
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Si la fila tiene menos de 3, agregar espacios vacíos */}
              {fila.length < 3 &&
                Array.from({ length: 3 - fila.length }).map((_, i) => (
                  <View key={"empty-" + i} style={styles.coverWrapper} />
                ))}
            </View>
          ))}
        </ScrollView>
      )}
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
  backBtn: {
    marginRight: 8,
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: "#3B2412",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#4b2e1e",
    borderWidth: 1,
    borderColor: "#e0d3c2",
    marginRight: 8,
  },
  searchBtn: {
    backgroundColor: "#332018",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  searchBtnText: {
    color: "#f3e8da",
    fontSize: 16,
    fontWeight: "bold",
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
    height: COVER_SIZE * 1.45 + 32,
    borderRadius: 14,
    backgroundColor: "#FFF4E4",
    marginHorizontal: Platform.OS === "web" ? 10 : 2,
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
    paddingBottom: 32,
  },
  cover: {
    width: "100%",
    height: COVER_SIZE * 1.45,
    borderRadius: 14,
    backgroundColor: "#FFF4E4",
  },
  bookTitle: {
    fontSize: 13,
    color: "#3B2412",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
    width: "100%",
    paddingHorizontal: 2,
  },
});
