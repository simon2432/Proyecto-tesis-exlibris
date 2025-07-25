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
  Modal,
  Pressable,
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
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [creatingCompra, setCreatingCompra] = useState(false);

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
    setShowDeliveryModal(true);
  };

  const handleTipoEntrega = async (tipoEntrega: "envio" | "encuentro") => {
    if (!publicacion) return;

    setShowDeliveryModal(false);
    setCreatingCompra(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No hay token de autenticación");
        return;
      }

      // Crear la compra
      const compraData = {
        publicacionId: publicacion.id,
        vendedorId: publicacion.vendedor.id,
        tipoEntrega: tipoEntrega,
        estado: tipoEntrega === "encuentro" ? "encuentro" : "pago_pendiente",
        precio: publicacion.precio,
      };

      console.log("Creando compra:", compraData);

      const response = await axios.post(`${API_BASE_URL}/compras`, compraData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Compra creada exitosamente:", response.data);

      // Si es encuentro, redirigir al historial de compras
      if (tipoEntrega === "encuentro") {
        router.replace("/historial-compras");
      } else {
        // Para envío, aquí se podría redirigir a una página de pago
        console.log("Redirigiendo a página de pago para envío");
      }
    } catch (error) {
      console.error("Error creando compra:", error);
      // Aquí se podría mostrar un mensaje de error al usuario
    } finally {
      setCreatingCompra(false);
    }
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
        <TouchableOpacity
          style={[styles.buyButton, creatingCompra && styles.buyButtonDisabled]}
          onPress={handleComprar}
          disabled={creatingCompra}
        >
          {creatingCompra ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buyButtonText}>COMPRAR</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de selección de tipo de entrega */}
      <Modal
        visible={showDeliveryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeliveryModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDeliveryModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccione tipo de entrega</Text>

            <TouchableOpacity
              style={styles.deliveryOption}
              onPress={() => handleTipoEntrega("envio")}
            >
              <Text style={styles.deliveryOptionText}>Envío</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deliveryOption}
              onPress={() => handleTipoEntrega("encuentro")}
            >
              <Text style={styles.deliveryOptionText}>Encuentro</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

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
  buyButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 20,
  },
  deliveryOption: {
    backgroundColor: "#f3e8da",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  deliveryOptionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B2412",
  },
});
