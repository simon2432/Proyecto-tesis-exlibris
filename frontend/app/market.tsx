import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import HeaderMarketplace from "../components/HeaderMarketplace";
import CustomTabBar from "../components/CustomTabBar";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MarketScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <HeaderMarketplace />
      <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Botones superiores */}
        <View style={styles.topButtonsRow}>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonText}>Tus publicaciones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton}>
            <Text style={styles.topButtonText}>Historial de compras</Text>
          </TouchableOpacity>
        </View>
        {/* Título */}
        <Text style={styles.sectionTitle}>Encuentra tu siguiente libro</Text>
        {/* Grilla de publicaciones */}
        <View style={styles.grid}>
          {/* Aquí van las publicaciones dinámicas */}
          {[...Array(10)].map((_, idx) => (
            <View key={idx} style={styles.bookCard} />
          ))}
        </View>
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
    justifyContent: "flex-start",
    gap: 18,
    marginHorizontal: 12,
  },
  bookCard: {
    width: SCREEN_WIDTH / 2.4,
    height: 170,
    backgroundColor: "#FFF4E4",
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});
