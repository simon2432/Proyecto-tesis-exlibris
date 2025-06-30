import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HeaderHomeProps {
  onSearch?: (text: string) => void;
  onFilterChange?: (filters: {
    libro: boolean;
    autor: boolean;
    genero: boolean;
  }) => void;
}

export default function HeaderHome({
  onSearch,
  onFilterChange,
}: HeaderHomeProps) {
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [checked, setChecked] = useState({
    libro: false,
    autor: false,
    genero: false,
  });

  const toggleCheck = (key: "libro" | "autor" | "genero") => {
    const newChecked = { ...checked, [key]: !checked[key] };
    setChecked(newChecked);
    onFilterChange?.(newChecked);
  };

  return (
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
          onChangeText={onSearch}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFiltrosVisible(true)}
        >
          <Text style={styles.filterButtonText}>Filtros</Text>
        </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFF4E4",
    paddingTop: Platform.OS === "android" ? 50 : 50,
    paddingBottom: 10,
    paddingHorizontal: "4%",
    borderBottomWidth: 1,
    borderBottomColor: "#FFF4E4",
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
    width: 65,
    height: 65,
    resizeMode: "contain",
    marginTop: 4,
    marginBottom: 15,
    marginLeft: 30,
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
    marginBottom: 4,
    marginLeft: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    width: "70%",
    minHeight: 38,
    maxHeight: 44,
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
    color: "#f3e8da",
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
});
