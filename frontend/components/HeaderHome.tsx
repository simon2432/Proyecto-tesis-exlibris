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
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGoogleBooksSearch } from "../hooks/useGoogleBooksSearch";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface HeaderHomeProps {
  onSearch?: (text: string) => void;
  onFilterChange?: (filter: string | null) => void;
  onBookSelect?: (book: any) => void;
}

export default function HeaderHome({
  onSearch,
  onFilterChange,
  onBookSelect,
}: HeaderHomeProps) {
  const [filtrosVisible, setFiltrosVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { results, loading, searchBooks, searchInfo, clearResults } =
    useGoogleBooksSearch();

  const toggleFilter = (filter: "libro" | "autor" | "genero") => {
    const newFilter = selectedFilter === filter ? null : filter;
    setSelectedFilter(newFilter);
    onFilterChange?.(newFilter);
    // Cerrar el modal después de seleccionar
    setFiltrosVisible(false);

    // Si hay texto de búsqueda, ejecutar búsqueda con el nuevo filtro
    if (searchText.length >= 2) {
      searchBooks(searchText, newFilter);
      setShowDropdown(true);
    }
  };

  const handleSearchChange = (text: string) => {
    console.log("[HeaderHome] handleSearchChange:", text);
    setSearchText(text);
    onSearch?.(text);
  };

  const handleSearchPress = () => {
    console.log(
      "[HeaderHome] handleSearchPress:",
      searchText,
      "con filtro:",
      selectedFilter
    );
    console.log(
      "[HeaderHome] searchBooks es:",
      typeof searchBooks,
      searchBooks
    );
    if (searchText.length >= 2) {
      searchBooks(searchText, selectedFilter);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleBookSelect = (book: any) => {
    // Cerrar modal inmediatamente
    setShowDropdown(false);
    setSearchText("");

    // Limpiar resultados inmediatamente
    clearResults();

    const bookWithFlag = {
      ...book,
      descriptionGenerated: book.descriptionGenerated || false,
    };
    onBookSelect?.(bookWithFlag);
  };

  const getResultsText = () => {
    if (!searchInfo)
      return `${results.length} libro${
        results.length !== 1 ? "s" : ""
      } encontrado${results.length !== 1 ? "s" : ""}`;

    if (searchInfo.totalFound === searchInfo.totalReturned) {
      return `${searchInfo.totalFound} libro${
        searchInfo.totalFound !== 1 ? "s" : ""
      } encontrado${searchInfo.totalFound !== 1 ? "s" : ""}`;
    } else {
      return `${searchInfo.totalReturned} de ${searchInfo.totalFound} libros encontrados`;
    }
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
        <TouchableOpacity onPress={handleSearchPress}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#7c4a2d"
              style={{ marginLeft: 8 }}
            />
          ) : (
            <Ionicons
              name="search"
              size={20}
              color="#4b2e1e"
              style={{ marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar libros..."
          placeholderTextColor="#a08b7d"
          value={searchText}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onSubmitEditing={handleSearchPress}
        />
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter && styles.filterButtonActive,
          ]}
          onPress={() => setFiltrosVisible(true)}
        >
          <Text style={styles.filterButtonText}>
            {selectedFilter
              ? selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)
              : "Filtros"}
          </Text>
          {selectedFilter && (
            <Ionicons
              name="checkmark-circle"
              size={12}
              color="#f3e8da"
              style={{ marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>
      </View>
      {/* Modal de resultados de búsqueda */}
      {showDropdown && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowDropdown(false);
            setSearchText("");
            clearResults();
          }}
        >
          <Pressable
            style={styles.modalOverlayBg}
            onPress={() => {
              setShowDropdown(false);
              setSearchText("");
              clearResults();
            }}
          >
            <View style={styles.dropdownModalContent}>
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#7c4a2d"
                  style={{ margin: 10 }}
                />
              ) : results.length === 0 ? (
                <Text style={{ color: "#7c4a2d", padding: 10 }}>
                  No se encontraron libros
                </Text>
              ) : (
                <React.Fragment>
                  <Text style={styles.resultsCount}>{getResultsText()}</Text>
                  <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => handleBookSelect(item)}
                      >
                        {item.image && (
                          <Image
                            source={{ uri: item.image }}
                            style={styles.dropdownImage}
                          />
                        )}
                        <View style={styles.dropdownTextContainer}>
                          <Text style={styles.dropdownTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          {item.authors && item.authors.length > 0 && (
                            <Text
                              style={styles.dropdownAuthor}
                              numberOfLines={1}
                            >
                              {Array.isArray(item.authors)
                                ? item.authors.join(", ")
                                : item.authors}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 300 }}
                    showsVerticalScrollIndicator={true}
                  />
                </React.Fragment>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
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
              <Text style={styles.filtrosTitle}>Selecciona un filtro:</Text>
              {(["libro", "autor", "genero"] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.checkRow,
                    selectedFilter === filter && styles.selectedRow,
                  ]}
                  onPress={() => toggleFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      selectedFilter === filter
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={22}
                    color={selectedFilter === filter ? "#7c4a2d" : "#4b2e1e"}
                  />
                  <Text
                    style={[
                      styles.checkLabel,
                      selectedFilter === filter && styles.selectedLabel,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
              {selectedFilter && (
                <TouchableOpacity
                  style={[styles.checkRow, { marginTop: 10 }]}
                  onPress={() => {
                    setSelectedFilter(null);
                    onFilterChange?.(null);
                    setFiltrosVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={22} color="#e74c3c" />
                  <Text style={[styles.checkLabel, { color: "#e74c3c" }]}>
                    Limpiar filtro
                  </Text>
                </TouchableOpacity>
              )}
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
  filterButtonActive: {
    backgroundColor: "#7c4a2d",
  },
  filterButtonText: {
    color: "#f3e8da",
    fontWeight: "bold",
    fontSize: 15,
  },
  modalOverlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
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
  selectedRow: {
    backgroundColor: "#f3e8da",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectedLabel: {
    color: "#7c4a2d",
    fontWeight: "bold",
  },
  dropdownModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 200,
    maxHeight: 400,
    width: "85%",
    alignSelf: "center",
    padding: 12,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
  },
  dropdownImage: {
    width: 40,
    height: 56,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#FFF4E4",
  },
  dropdownTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#3B2412",
    flex: 1,
    flexWrap: "wrap",
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#7c4a2d",
    marginBottom: 8,
    textAlign: "center",
  },
  dropdownTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  dropdownAuthor: {
    fontSize: 13,
    color: "#a08b7d",
    marginTop: 2,
    fontStyle: "italic",
  },
});
