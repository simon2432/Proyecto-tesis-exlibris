import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../constants/ApiConfig";
import CustomTabBar from "../../components/CustomTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Publicacion {
  id: number;
  titulo: string;
  autor: string;
  genero: string;
  editorial: string;
  paginas: number;
  idioma: string;
  estadoLibro: string;
  precio: number;
  imagenUrl: string | null;
  fechaPublicacion: string;
  vendedor: {
    id: number;
    nombre: string;
    ubicacion: string | null;
    puntuacionVendedor: number | null;
  };
}

export default function PublicacionDetalleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicacion();
  }, [id]);

  const fetchPublicacion = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/publicaciones/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log("Datos de la publicación recibidos:", response.data);
      setPublicacion(response.data);
    } catch (err) {
      console.error("Error fetching publicacion:", err);
      setError("Error al cargar la publicación");
    } finally {
      setLoading(false);
    }
  };

  const handleComprar = () => {
    // Aquí se implementaría la lógica de compra
    console.log("Comprar publicación:", publicacion?.id);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/lechuza.png")}
            style={styles.logo}
          />
          <Text style={styles.logoText}>EXLIBRIS</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B2412" />
          <Text style={styles.loadingText}>Cargando publicación...</Text>
        </View>
      </View>
    );
  }

  if (error || !publicacion) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/lechuza.png")}
            style={styles.logo}
          />
          <Text style={styles.logoText}>EXLIBRIS</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Publicación no encontrada"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/lechuza.png")}
          style={styles.logo}
        />
        <Text style={styles.logoText}>EXLIBRIS</Text>
      </View>

      {/* Botón Volver */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contenido principal */}
        <View style={styles.mainContent}>
          {/* Sección izquierda: Imagen y precio */}
          <View style={styles.leftSection}>
            <View style={styles.imageContainer}>
              {publicacion.imagenUrl ? (
                <Image
                  source={{ uri: `${API_BASE_URL}${publicacion.imagenUrl}` }}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderText}>Sin imagen</Text>
                </View>
              )}
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                ${publicacion.precio.toLocaleString("es-ES")}
              </Text>
            </View>
          </View>

          {/* Sección derecha: Detalles del libro */}
          <View style={styles.rightSection}>
            <Text style={styles.bookTitle}>{publicacion.titulo}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Autor:</Text>
              <Text style={styles.detailValue}>{publicacion.autor}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Género:</Text>
              <Text style={styles.detailValue}>{publicacion.genero}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Editorial:</Text>
              <Text style={styles.detailValue}>{publicacion.editorial}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cantidad de páginas:</Text>
              <Text style={styles.detailValue}>{publicacion.paginas}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Idioma:</Text>
              <Text style={styles.detailValue}>{publicacion.idioma}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={styles.detailValue}>{publicacion.estadoLibro}</Text>
            </View>
          </View>
        </View>

        {/* Perfil del vendedor */}
        <View style={styles.sellerSection}>
          <Text style={styles.sellerTitle}>Perfil del vendedor</Text>

          <View style={styles.sellerDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dueño:</Text>
              <Text style={styles.detailValue}>
                {publicacion.vendedor.nombre}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Libros vendidos:</Text>
              <Text style={styles.detailValue}>4</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Libros comprados:</Text>
              <Text style={styles.detailValue}>11</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Puntuación de vendedor:</Text>
              <Text style={styles.detailValue}>
                {publicacion.vendedor.puntuacionVendedor || 4.5} ⭐
              </Text>
            </View>

            {publicacion.vendedor.ubicacion && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ubicación:</Text>
                <Text style={styles.detailValue}>
                  {publicacion.vendedor.ubicacion}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Botón Comprar */}
        <TouchableOpacity style={styles.buyButton} onPress={handleComprar}>
          <Text style={styles.buyButtonText}>COMPRAR</Text>
        </TouchableOpacity>
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
  header: {
    backgroundColor: "#fff4e4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingTop: 50,
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
  },
  backButton: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 18,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#3B2412",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
  },
  mainContent: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginTop: 20,
    gap: 20,
    ...(Platform.OS === "web" && {
      maxWidth: 800,
      alignSelf: "center",
      width: "100%",
    }),
  },
  leftSection: {
    flex: 1,
    maxWidth: 150,
  },
  rightSection: {
    flex: 2,
  },
  imageContainer: {
    marginBottom: 12,
  },
  bookImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#e9e3de",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#7c4a2d",
    fontSize: 14,
  },
  priceContainer: {
    backgroundColor: "#f3e8da",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  priceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 14,
    color: "#7c4a2d",
    width: 140,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3B2412",
    flex: 1,
  },
  sellerSection: {
    paddingHorizontal: 18,
    marginTop: 30,
    ...(Platform.OS === "web" && {
      maxWidth: 800,
      alignSelf: "center",
      width: "100%",
    }),
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
    textAlign: "center",
    marginBottom: 16,
  },
  sellerDetails: {
    backgroundColor: "#fff4e4",
    borderRadius: 12,
    padding: 16,
  },
  buyButton: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 18,
    marginTop: 24,
    alignItems: "center",
    ...(Platform.OS === "web" && {
      maxWidth: 800,
      alignSelf: "center",
      width: "100%",
    }),
  },
  buyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textTransform: "uppercase",
  },
});
