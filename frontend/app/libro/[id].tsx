import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LibroDetalleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const libro: any = params;

  const renderField = (label: string, value: string | undefined) => {
    if (!value || value.trim() === "") return null;
    return (
      <Text style={styles.bookMeta}>
        <Text style={styles.bold}>{label}:</Text> {value}
      </Text>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Agregar al historial lector</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.bookInfoRow}>
          {libro.image && (
            <Image source={{ uri: libro.image }} style={styles.bookImage} />
          )}
          <View style={styles.bookInfoCol}>
            <Text style={styles.bookTitle}>{libro.title}</Text>
            {renderField("Autor", libro.authors)}
            {renderField("Género", libro.categories)}
            {renderField("Editorial", libro.publisher)}
            {renderField("Fecha de publicación", libro.publishedDate)}
            {renderField("Páginas", libro.pageCount)}
            {renderField("Idioma", libro.language)}
          </View>
        </View>

        {libro.description && (
          <>
            <Text style={styles.sectionTitle}>Descripción:</Text>
            <Text style={styles.description}>{libro.description}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Reseñas</Text>
        <View style={styles.reviewsPlaceholder}>
          <Text style={{ color: "#a08b7d", fontStyle: "italic" }}>
            Aquí aparecerán las reseñas de los usuarios.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF4E4",
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF4E4",
  },
  logo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    letterSpacing: 1.5,
  },
  backButton: {
    backgroundColor: "#7c4a2d",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "#332018",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  addButtonText: {
    color: "#f3e8da",
    fontWeight: "bold",
    fontSize: 15,
  },
  bookInfoRow: {
    flexDirection: "row",
    marginTop: 18,
    marginHorizontal: 18,
    alignItems: "flex-start",
  },
  bookImage: {
    width: 120,
    height: 170,
    borderRadius: 10,
    marginRight: 18,
    backgroundColor: "#FFF4E4",
  },
  bookInfoCol: {
    flex: 1,
    justifyContent: "flex-start",
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 6,
  },
  bookMeta: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
  bold: {
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#3B2412",
    marginTop: 18,
    marginBottom: 6,
    marginLeft: 18,
  },
  description: {
    fontSize: 15,
    color: "#3B2412",
    marginHorizontal: 18,
    marginBottom: 10,
    textAlign: "justify",
  },
  reviewsPlaceholder: {
    minHeight: 80,
    backgroundColor: "#FFF4E4",
    borderRadius: 12,
    marginHorizontal: 18,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
});
