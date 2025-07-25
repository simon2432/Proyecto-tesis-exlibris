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
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../constants/ApiConfig";
import CustomTabBar from "../../components/CustomTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Compra {
  id: number;
  estado: string;
  tipoEntrega: string;
  precio: number;
  fechaCompra: string;
  publicacion: {
    id: number;
    titulo: string;
    autor: string;
    genero: string;
    editorial: string;
    paginas: number;
    idioma: string;
    estadoLibro: string;
    imagenUrl: string;
  };
  vendedor: {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    ubicacion: string;
    puntuacionVendedor: number;
    librosVendidos: number;
    librosComprados: number;
  };
}

export default function CompraDetalleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [compra, setCompra] = useState<Compra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCompra();
  }, [id]);

  const fetchCompra = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/compras/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Datos de la compra recibidos:", data);
        setCompra(data);
      } else {
        console.error("Error fetching compra:", response.status);
        setError("Error al cargar la compra");
      }
    } catch (err) {
      console.error("Error en fetchCompra:", err);
      setError("Error al cargar la compra");
    } finally {
      setLoading(false);
    }
  };

  const handleTransaccionRealizada = async () => {
    Alert.alert(
      "Confirmar transacción",
      "¿Estás seguro de que ya realizaste el pago y recibiste el libro en buenas condiciones?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            setUpdating(true);
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(
                `${API_BASE_URL}/compras/${id}/completar`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ estado: "completado" }),
                }
              );

              if (response.ok) {
                Alert.alert("Éxito", "Transacción marcada como completada");
                fetchCompra(); // Recargar datos
              } else {
                Alert.alert("Error", "No se pudo completar la transacción");
              }
            } catch (error) {
              console.error("Error completando transacción:", error);
              Alert.alert("Error", "Error al completar la transacción");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelarCompra = async () => {
    Alert.alert(
      "Cancelar compra",
      "¿Estás seguro de que quieres cancelar esta compra?",
      [
        {
          text: "No cancelar",
          style: "cancel",
        },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            setUpdating(true);
            try {
              const token = await AsyncStorage.getItem("token");
              const response = await fetch(
                `${API_BASE_URL}/compras/${id}/cancelar`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                Alert.alert("Éxito", "Compra cancelada exitosamente");
                router.replace("/historial-compras");
              } else {
                Alert.alert("Error", "No se pudo cancelar la compra");
              }
            } catch (error) {
              console.error("Error cancelando compra:", error);
              Alert.alert("Error", "Error al cancelar la compra");
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pago_pendiente":
        return { backgroundColor: "#c6f6fa", color: "#3B2412" };
      case "encuentro":
        return { backgroundColor: "#ffb3d9", color: "#3B2412" };
      case "envio_pendiente":
        return { backgroundColor: "#e9d6fa", color: "#3B2412" };
      case "en_camino":
        return { backgroundColor: "#e9d6fa", color: "#3B2412" };
      case "completado":
        return { backgroundColor: "#c6fadc", color: "#3B2412" };
      default:
        return { backgroundColor: "#eee", color: "#3B2412" };
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case "pago_pendiente":
        return "Pago pendiente";
      case "encuentro":
        return "Encuentro";
      case "envio_pendiente":
        return "Envío pendiente";
      case "en_camino":
        return "En camino";
      case "completado":
        return "Completado";
      default:
        return estado;
    }
  };

  const getInstrucciones = (tipoEntrega: string, estado: string) => {
    if (estado === "completado") {
      return "Esta transacción ha sido completada exitosamente.";
    }

    if (tipoEntrega === "encuentro") {
      return "Presione el siguiente botón si ya realizó el pago del libro y recibió el mismo en condiciones. Debe coordinar el encuentro con el vendedor.";
    } else {
      return "Presione el siguiente botón si ya realizó el pago del libro y lo recibió en buenas condiciones.";
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logoLechuza.png")}
            style={styles.logo}
          />
          <Text style={styles.logoText}>EXLIBRIS</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B2412" />
          <Text style={styles.loadingText}>
            Cargando detalles de la compra...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !compra) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logoLechuza.png")}
            style={styles.logo}
          />
          <Text style={styles.logoText}>EXLIBRIS</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Compra no encontrada"}
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
          source={require("../../assets/images/logoLechuza.png")}
          style={styles.logo}
        />
        <Text style={styles.logoText}>EXLIBRIS</Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelarCompra}
          disabled={updating || compra.estado === "completado"}
        >
          <Text style={styles.cancelButtonText}>Cancelar compra</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Detalles de la compra</Text>

        {/* Detalles del libro */}
        <View style={styles.mainContent}>
          {/* Sección izquierda: Imagen */}
          <View style={styles.leftSection}>
            <View style={styles.imageContainer}>
              {compra.publicacion.imagenUrl ? (
                <Image
                  source={{
                    uri: `${API_BASE_URL}${compra.publicacion.imagenUrl}`,
                  }}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderText}>Sin imagen</Text>
                </View>
              )}
            </View>
          </View>

          {/* Sección derecha: Detalles del libro */}
          <View style={styles.rightSection}>
            <Text style={styles.bookTitle}>{compra.publicacion.titulo}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Autor:</Text>
              <Text style={styles.detailValue}>{compra.publicacion.autor}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Género:</Text>
              <Text style={styles.detailValue}>
                {compra.publicacion.genero}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Editorial:</Text>
              <Text style={styles.detailValue}>
                {compra.publicacion.editorial}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cantidad de páginas:</Text>
              <Text style={styles.detailValue}>
                {compra.publicacion.paginas}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Idioma:</Text>
              <Text style={styles.detailValue}>
                {compra.publicacion.idioma}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={styles.detailValue}>
                {compra.publicacion.estadoLibro}
              </Text>
            </View>
          </View>
        </View>

        {/* Perfil del vendedor */}
        <View style={styles.sellerSection}>
          <Text style={styles.sellerTitle}>Perfil del vendedor</Text>

          <View style={styles.sellerDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vendedor:</Text>
              <Text style={styles.detailValue}>{compra.vendedor.nombre}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{compra.vendedor.email}</Text>
            </View>

            {compra.vendedor.telefono && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Teléfono:</Text>
                <Text style={styles.detailValue}>
                  {compra.vendedor.telefono}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Libros vendidos:</Text>
              <Text style={styles.detailValue}>
                {compra.vendedor.librosVendidos}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Libros comprados:</Text>
              <Text style={styles.detailValue}>
                {compra.vendedor.librosComprados}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Puntuación de vendedor:</Text>
              <Text style={styles.detailValue}>
                {compra.vendedor.puntuacionVendedor} ⭐
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ubicación:</Text>
              <Text style={styles.detailValue}>
                {compra.vendedor.ubicacion}
              </Text>
            </View>
          </View>
        </View>

        {/* Estado de la compra */}
        <View style={styles.purchaseStatusSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Fecha de solicitud de compra:
            </Text>
            <Text style={styles.detailValue}>
              {new Date(compra.fechaCompra).toLocaleDateString("es-ES")}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado:</Text>
            <View style={[styles.estadoTag, getEstadoColor(compra.estado)]}>
              <Text style={styles.estadoText}>
                {getEstadoText(compra.estado)}
              </Text>
            </View>
          </View>

          <Text style={styles.instructions}>
            {getInstrucciones(compra.tipoEntrega, compra.estado)}
          </Text>

          {compra.estado !== "completado" && (
            <TouchableOpacity
              style={[
                styles.completeButton,
                updating && styles.completeButtonDisabled,
              ]}
              onPress={handleTransaccionRealizada}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.completeButtonText}>
                  Transacción realizada
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Confirmación vendedor:</Text>
            <Text style={styles.detailValue}>
              {compra.estado === "completado" ? "Confirmado" : "Pendiente"}
            </Text>
          </View>
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backButton: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
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
    marginBottom: 20,
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
    marginBottom: 20,
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
  purchaseStatusSection: {
    paddingHorizontal: 18,
    marginBottom: 20,
    ...(Platform.OS === "web" && {
      maxWidth: 800,
      alignSelf: "center",
      width: "100%",
    }),
  },
  estadoTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  instructions: {
    fontSize: 14,
    color: "#3B2412",
    textAlign: "center",
    marginVertical: 16,
    lineHeight: 20,
    backgroundColor: "#f3e8da",
    padding: 12,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingVertical: 16,
    marginVertical: 16,
    alignItems: "center",
  },
  completeButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  completeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textTransform: "uppercase",
  },
});
