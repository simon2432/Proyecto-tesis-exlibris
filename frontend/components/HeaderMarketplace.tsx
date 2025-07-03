import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderMarketplaceProps {
  onSearch?: (text: string) => void;
  onFilterPress?: () => void;
}

export default function HeaderMarketplace({
  onSearch,
  onFilterPress,
}: HeaderMarketplaceProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          source={require("../assets/images/lechuza.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>EXLIBRIS</Text>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={18}
            color="#7c4a2d"
            style={{ marginLeft: 8, marginRight: 4 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#7c4a2d"
            onChangeText={onSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
          <Text style={styles.filterButtonText}>Filtros</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#FFF4E4",
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: "4%",
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
    width: "100%",
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 44,
    height: 44,
    marginTop: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    letterSpacing: 1.5,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 6,
    marginRight: 10,
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: "#e0d3c2",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#3B2412",
    paddingVertical: 0,
    paddingHorizontal: 6,
  },
  filterButton: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    height: 38,
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
