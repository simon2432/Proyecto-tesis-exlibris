import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HeaderMarketplace = () => {
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
        <TouchableOpacity>
          <Ionicons
            name="search"
            size={20}
            color="#4b2e1e"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar libros en venta..."
          placeholderTextColor="#a08b7d"
          editable={false}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Filtros</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFF4E4",
    paddingTop:
      Platform.OS === "android" ? 80 : Platform.OS === "web" ? 40 : 28,
    paddingBottom: 20,
    paddingHorizontal: "4%",
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
    height: 70,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    paddingLeft: 0,
    position: "relative",
    left: 0,
    top: 0,
    width: "auto",
    height: 44,
  },
  logo: {
    width: 44,
    height: 44,
    resizeMode: "contain",
    marginTop: 0,
    marginBottom: 25,
    marginLeft: 0,
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginBottom: 25,
    marginLeft: 0,
    elevation: 2,
    minHeight: 38,
    maxHeight: 44,
    alignSelf: "center",
    marginTop: 0,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#4b2e1e",
    marginLeft: 6,
    backgroundColor: "transparent",
    paddingVertical: 2,
    borderWidth: 0,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
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
});

export default HeaderMarketplace;
