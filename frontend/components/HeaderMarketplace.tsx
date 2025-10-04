import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderMarketplaceProps {
  onSearch?: (searchText: string) => void;
  onFiltrosPress?: () => void;
}

const HeaderMarketplace = ({
  onSearch,
  onFiltrosPress,
}: HeaderMarketplaceProps) => {
  const [searchText, setSearchText] = useState("");

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  const handleSearchPress = () => {
    onSearch?.(searchText);
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
        <Text style={styles.logoText}>EXLIBRIS</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={handleSearchPress}>
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
          value={searchText}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onSubmitEditing={handleSearchPress}
        />
        <TouchableOpacity style={styles.filterButton} onPress={onFiltrosPress}>
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
      Platform.OS === "android" ? 50 : Platform.OS === "web" ? 20 : 28,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
    width: "100%",
    zIndex: 10,
    minHeight: 100,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingLeft: 0,
    width: "auto",
    height: 44,
  },
  logo: {
    width: 44,
    height: 44,
    resizeMode: "contain",
    marginRight: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 0,
    elevation: 2,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#4b2e1e",
    marginLeft: 8,
    backgroundColor: "transparent",
    paddingVertical: 4,
    borderWidth: 0,
    height: 44,
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
