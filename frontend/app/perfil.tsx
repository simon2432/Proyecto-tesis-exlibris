import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import HeaderPerfil from "../components/HeaderPerfil";
import CustomTabBar from "../components/CustomTabBar";
import { useRouter } from "expo-router";

export default function PerfilScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <HeaderPerfil />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        <View style={styles.topButtonsRow}>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonText}>Agregar lectura</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonText}>Ver logros</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: "https://placehold.co/100x100" }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>SimonF</Text>
          <Text style={styles.profileGenre}>
            Género más leído:{" "}
            <Text style={{ fontWeight: "bold" }}>Ciencia ficción</Text>
          </Text>
          <Text style={styles.profileBooks}>
            Libros leídos: <Text style={{ fontWeight: "bold" }}>244</Text>
          </Text>
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Tus 3 libros favoritos</Text>
          <TouchableOpacity style={styles.sectionButton}>
            <Text style={styles.sectionButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.booksRowCentered}>
          <View style={styles.bookCoverPlaceholder} />
          <View style={styles.bookCoverPlaceholder} />
          <View style={styles.bookCoverPlaceholder} />
        </View>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Historial lector</Text>
          <TouchableOpacity style={styles.sectionButton}>
            <Text style={styles.sectionButtonText}>Ver historial</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.booksRowCentered}>
          <View style={styles.bookCoverPlaceholder} />
          <View style={styles.bookCoverPlaceholder} />
          <View style={styles.bookCoverPlaceholder} />
        </View>
        <View style={styles.sellerSection}>
          <Text style={styles.sellerTitle}>Perfil vendedor</Text>
          <Text style={styles.sellerStat}>
            Libros vendidos: <Text style={{ fontWeight: "bold" }}>4</Text>
          </Text>
          <Text style={styles.sellerStat}>
            Libros comprados: <Text style={{ fontWeight: "bold" }}>11</Text>
          </Text>
          <Text style={[styles.sellerStat, { fontWeight: "bold" }]}>
            Puntuacion de vendedor: 4.5⭐
          </Text>
        </View>
      </ScrollView>
      <CustomTabBar
        activeTab="perfil"
        onTabPress={(tab) => {
          if (tab === "home") router.replace("/home");
          else if (tab === "market") router.replace("/market");
          else if (tab === "perfil") router.replace("/perfil");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 18,
    marginRight: 18,
  },
  topButton: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  topButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 18,
    marginBottom: 18,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "#FFF4E4",
    marginBottom: 8,
    backgroundColor: "#FFF4E4",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 2,
  },
  profileGenre: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
  profileBooks: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#3B2412",
  },
  sectionButton: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  sectionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  booksRowCentered: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginHorizontal: 18,
    marginBottom: 10,
    marginTop: 6,
  },
  bookCoverPlaceholder: {
    width: 90,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#FFF4E4",
    borderWidth: 1.5,
    borderColor: "#e0d3c2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sellerSection: {
    backgroundColor: "#FFF4E4",
    borderRadius: 16,
    marginHorizontal: 18,
    marginTop: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  sellerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 8,
  },
  sellerStat: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
});
