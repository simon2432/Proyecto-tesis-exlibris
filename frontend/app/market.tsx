import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
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
        <Text style={styles.sectionTitle}>Encuentra tu siguiente libro</Text>
        {/* Grilla de publicaciones */}
        <View style={styles.grid}>
          {[...Array(10)].map((_, idx) => (
            <View key={idx} style={styles.bookCard}>
              {/* Imagen vacía (simulación) */}
              <View style={styles.imagePlaceholder} />
              {/* Etiqueta de precio dummy */}
              <View style={styles.priceTagShadow}>
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>$00.000</Text>
                </View>
              </View>
            </View>
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
});
