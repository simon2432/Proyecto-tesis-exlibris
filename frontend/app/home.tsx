import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from "react-native";
import CustomTabBar from "../components/CustomTabBar";
import HeaderHome from "../components/HeaderHome";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();

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
        authors: book.authors?.join(", ") || "",
        publisher: book.publisher || "",
        publishedDate: book.publishedDate || "",
        description: book.description || "",
        pageCount: book.pageCount || "",
        categories: book.categories?.join(", ") || "",
        language: book.language || "",
        image: book.image || "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <HeaderHome
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onBookSelect={handleBookSelect}
        />

        {/* Contenido principal */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: SCREEN_HEIGHT * 0.18 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Te podría gustar</Text>
            <View style={styles.booksRow}>{/* Aquí irán los libros */}</View>
          </View>
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Explora nuevas lecturas</Text>
            <View style={styles.booksRow}>{/* Aquí irán los libros */}</View>
          </View>
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>En venta cerca tuyo</Text>
            <View style={styles.booksRow}>{/* Aquí irán los libros */}</View>
          </View>
        </ScrollView>

        {/* TabBar */}
        <CustomTabBar
          activeTab="home"
          onTabPress={(tab) => {
            if (tab === "home") return;
            if (tab === "market") router.replace("/market");
            if (tab === "perfil") router.replace("/perfil");
          }}
        />

        {/* Botón flotante de recomendaciones */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
          <Text style={styles.fabText}>Recomendaciones inteligentes 📚</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3e8da",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    width: "100%",
    minHeight: "100%",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: "4%",
    backgroundColor: "#FFFFFF",
    width: "100%",
    marginTop: 30,
  },
  sectionBox: {
    backgroundColor: "#FFF4E4",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 18,
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
    bottom: 80,
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
