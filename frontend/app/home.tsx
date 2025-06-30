import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import CustomTabBar from "../components/CustomTabBar";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [checked, setChecked] = useState({
    libro: false,
    autor: false,
    genero: false,
  });
  const router = useRouter();

  const toggleCheck = (key: "libro" | "autor" | "genero") =>
    setChecked({ ...checked, [key]: !checked[key] });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {/* Logo principal */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/logoLechuza.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#4b2e1e"
              style={{ marginLeft: 8 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar"
              placeholderTextColor="#a08b7d"
            />
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFiltrosVisible(true)}
            >
              <Text style={styles.filterButtonText}>Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal de filtros */}
        <Modal
          visible={filtrosVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFiltrosVisible(false)}
        >
          <View style={styles.modalOverlayBg}>
            <Pressable
              style={styles.modalOverlayPressable}
              onPress={() => setFiltrosVisible(false)}
            >
              <View style={styles.filtrosModal}>
                <Text style={styles.filtrosTitle}>Filtrar por:</Text>
                {(["libro", "autor", "genero"] as const).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.checkRow}
                    onPress={() => toggleCheck(key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={checked[key] ? "checkbox" : "square-outline"}
                      size={22}
                      color="#4b2e1e"
                    />
                    <Text style={styles.checkLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </View>
        </Modal>

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
    backgroundColor: "#FFF4E4",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    width: "100%",
    minHeight: "100%",
  },
  header: {
    backgroundColor: "#FFF4E4",
    paddingTop: Platform.OS === "android" ? 40 : 50,
    paddingBottom: 10,
    paddingHorizontal: "4%",
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
    width: "100%",
  },
  logoContainer: {
    position: "absolute",
    left: 0,
    top: Platform.OS === "android" ? 40 : 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginTop: 4,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: SCREEN_WIDTH < 350 ? 18 : 24,
    fontWeight: "bold",
    color: "#7c4a2d",
    textAlign: "left",
    marginLeft: 60,
    marginBottom: 8,
    letterSpacing: 2,
    fontFamily: Platform.OS === "android" ? "serif" : undefined,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 50,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    width: "80%",
    alignSelf: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#4b2e1e",
    marginLeft: 6,
    backgroundColor: "transparent",
    paddingVertical: 2,
  },
  filterButton: {
    backgroundColor: "#332018",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  filterButtonText: {
    color: "#FFF4E4",
    fontWeight: "bold",
    fontSize: 15,
  },
  modalOverlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 100,
  },
  modalOverlayPressable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filtrosModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    minWidth: 220,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  filtrosTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#4b2e1e",
    marginBottom: 12,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: "#4b2e1e",
  },
  scroll: {
    marginTop: 30,
    flex: 1,
    paddingHorizontal: "4%",
    backgroundColor: "#FFFFFF",
    width: "100%",
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
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0d3c2",
    elevation: 10,
    zIndex: 10,
    width: "100%",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
