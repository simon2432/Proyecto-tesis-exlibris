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
  Modal,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../constants/ApiConfig";
import CustomTabBar from "../../components/CustomTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Venta {
  id: number;
  estado: string;
  tipoEntrega: string;
  precio: number;
  fechaCompra: string;
  compradorConfirmado: boolean;
  vendedorConfirmado: boolean;
  valoracionComprador?: number; // Valoración del 1 al 5 que recibió del comprador
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
  comprador: {
    id: number;
    nombre: string;
    email: string;
    telefono: string;
    ubicacion: string;
    puntuacionVendedor: number;
    librosVendidos: number;
    librosComprados: number;
  };
}

export default function DetalleVenta() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmandoPago, setConfirmandoPago] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchVenta();
  }, [id]);

  const fetchVenta = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/compras/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log("[Venta] Datos recibidos:", data);

        // Cargar datos completos del comprador usando su ID
        if (data.compradorId) {
          const compradorRes = await fetch(
            `${API_BASE_URL}/usuarios/${data.compradorId}`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );
          if (compradorRes.ok) {
            const compradorData = await compradorRes.json();
            console.log(
              "[Venta] Datos completos del comprador:",
              compradorData
            );
            console.log(
              "[Venta] Teléfono del comprador:",
              compradorData.telefono
            );
            console.log("[Venta] Email del comprador:", compradorData.email);

            // Combinar los datos de la venta con los datos completos del comprador
            setVenta({
              ...data,
              comprador: compradorData,
            });
          } else {
            console.error("Error fetching comprador:", compradorRes.status);
            setVenta(data);
          }
        } else {
          setVenta(data);
        }
      } else {
        console.error("Error fetching venta:", res.status);
      }
    } catch (error) {
      console.error("Error fetching venta:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarPago = () => {
    setShowConfirmModal(true);
  };

  const confirmarPagoVendedor = async () => {
    setConfirmandoPago(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/compras/${id}/confirmar-pago-vendedor`,
        {
          method: "PATCH",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        setSuccessMessage("Pago confirmado exitosamente");
        setShowSuccessModal(true);
        fetchVenta(); // Recargar datos
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.error || "No se pudo confirmar el pago");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error confirmando pago:", error);
      setErrorMessage("No se pudo confirmar el pago");
      setShowErrorModal(true);
    } finally {
      setConfirmandoPago(false);
    }
  };

  const handleCancelarVenta = async () => {
    setShowCancelModal(true);
  };

  const confirmarCancelarVenta = async () => {
    try {
      setCanceling(true);
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/compras/${id}/cancelar-venta`,
        {
          method: "PATCH",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setSuccessMessage("Venta cancelada exitosamente");
        setShowSuccessModal(true);
        // Redirigir después de cerrar el modal
        setTimeout(() => {
          router.replace("/mis-publicaciones");
        }, 1500);
      } else {
        setErrorMessage("No se pudo cancelar la venta");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error cancelando venta:", error);
      setErrorMessage("Error al cancelar la venta");
      setShowErrorModal(true);
    } finally {
      setCanceling(false);
      setShowCancelModal(false);
    }
  };

  const cancelarVenta = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/compras/${id}/cancelar`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        setSuccessMessage("La venta ha sido cancelada");
        setShowSuccessModal(true);
        // Redirigir después de cerrar el modal
        setTimeout(() => {
          router.replace("/mis-publicaciones");
        }, 1500);
      } else {
        setErrorMessage("No se pudo cancelar la venta");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error cancelando venta:", error);
      setErrorMessage("No se pudo cancelar la venta");
      setShowErrorModal(true);
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
      case "comprador_confirmado":
        return "Comprador confirmó";
      case "vendedor_confirmado":
        return "Vendedor confirmó";
      case "completado":
        return "Completado";
      default:
        return estado;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pago_pendiente":
        return "#ffd700";
      case "encuentro":
        return "#ff69b4";
      case "envio_pendiente":
        return "#ffa500";
      case "en_camino":
        return "#87ceeb";
      case "comprador_confirmado":
        return "#ffb74d";
      case "vendedor_confirmado":
        return "#81c784";
      case "completado":
        return "#90ee90";
      default:
        return "#cccccc";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7c4a2d" style={styles.loader} />
      </View>
    );
  }

  if (!venta) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No se pudo cargar la información de la venta
        </Text>
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
          onPress={() => router.replace("/mis-publicaciones")}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        {venta.estado !== "completado" && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelarVenta}
            disabled={confirmandoPago}
          >
            <Text style={styles.cancelButtonText}>Cancelar venta</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Detalles de la venta</Text>

        {/* Detalles del libro */}
        <View style={styles.mainContent}>
          {/* Sección izquierda: Imagen */}
          <View style={styles.leftSection}>
            <View style={styles.imageContainer}>
              {venta.publicacion.imagenUrl ? (
                <Image
                  source={{
                    uri: `${API_BASE_URL}${venta.publicacion.imagenUrl}`,
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
            <Text style={styles.bookTitle}>{venta.publicacion.titulo}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Autor:</Text>
              <Text style={styles.detailValue}>{venta.publicacion.autor}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Género:</Text>
              <Text style={styles.detailValue}>{venta.publicacion.genero}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Editorial:</Text>
              <Text style={styles.detailValue}>
                {venta.publicacion.editorial}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cantidad de páginas:</Text>
              <Text style={styles.detailValue}>
                {venta.publicacion.paginas}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Idioma:</Text>
              <Text style={styles.detailValue}>{venta.publicacion.idioma}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={styles.detailValue}>
                {venta.publicacion.estadoLibro}
              </Text>
            </View>
          </View>
        </View>

        {/* Perfil del comprador */}
        <View style={styles.sellerSection}>
          <Text style={styles.sellerTitle}>Perfil del comprador</Text>

          <View style={styles.sellerDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Comprador:</Text>
              <Text style={styles.detailValue}>{venta.comprador.nombre}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{venta.comprador.email}</Text>
            </View>

            {venta.comprador.telefono && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Teléfono:</Text>
                <Text style={styles.detailValue}>
                  {venta.comprador.telefono}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Libros vendidos:</Text>
              <Text style={styles.detailValue}>
                {venta.comprador.librosVendidos || 0}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Libros comprados:</Text>
              <Text style={styles.detailValue}>
                {venta.comprador.librosComprados || 0}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Puntuación de comprador:</Text>
              <Text style={styles.detailValue}>
                {venta.comprador.puntuacionVendedor || 0} ⭐
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ubicación:</Text>
              <Text style={styles.detailValue}>
                {venta.comprador.ubicacion}
              </Text>
            </View>
          </View>
        </View>

        {/* Estado de la venta */}
        <View style={styles.purchaseStatusSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha de inicio de venta:</Text>
            <Text style={styles.detailValue}>
              {new Date(venta.fechaCompra).toLocaleDateString("es-ES")}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado:</Text>
            <View
              style={[
                styles.estadoTag,
                { backgroundColor: getEstadoColor(venta.estado) },
              ]}
            >
              <Text style={styles.estadoText}>
                {getEstadoText(venta.estado)}
              </Text>
            </View>
          </View>

          <Text style={styles.instructions}>
            {venta.estado === "completado"
              ? "Esta transacción ha sido completada exitosamente."
              : venta.estado === "envio_pendiente"
              ? "Debe realizar el envío y enviarle al comprador la información del envío. Una vez que el comprador confirme que recibió la información, el pedido pasará a estado 'En camino'."
              : venta.estado === "vendedor_confirmado"
              ? "Ya confirmaste el pago. Esperando confirmación del comprador."
              : venta.estado === "comprador_confirmado"
              ? "El comprador ya confirmó la transacción. Confirma que recibiste el pago para completar la transacción."
              : "Presione el siguiente botón si ya recibió el pago por parte del comprador. El comprador debe enviarle el comprobante del envio."}
          </Text>

          {venta.estado !== "completado" && !venta.vendedorConfirmado && (
            <TouchableOpacity
              style={[
                styles.completeButton,
                confirmandoPago && styles.completeButtonDisabled,
              ]}
              onPress={handleConfirmarPago}
              disabled={confirmandoPago}
            >
              {confirmandoPago ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.completeButtonText}>Pago recibido</Text>
              )}
            </TouchableOpacity>
          )}

          {venta.vendedorConfirmado && !venta.compradorConfirmado && (
            <View style={styles.waitingMessage}>
              <Text style={styles.waitingText}>
                Esperando confirmación del comprador...
              </Text>
            </View>
          )}

          {/* Sección de valoración - solo mostrar si está completada */}
          {venta.estado === "completado" && (
            <View style={styles.valoracionSection}>
              <Text style={styles.valoracionTitle}>
                Valoración del Comprador
              </Text>

              {venta.valoracionComprador ? (
                <View style={styles.valoracionRecibida}>
                  <Text style={styles.valoracionLabel}>
                    Valoración recibida del comprador:
                  </Text>
                  <View style={styles.estrellasValoracion}>
                    {[1, 2, 3, 4, 5].map((estrella) => (
                      <Text
                        key={estrella}
                        style={[
                          styles.estrella,
                          estrella <= venta.valoracionComprador!
                            ? styles.estrellaLlena
                            : styles.estrellaVacia,
                        ]}
                      >
                        ⭐
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.valoracionTexto}>
                    {venta.valoracionComprador}/5 estrellas
                  </Text>
                  <Text style={styles.valoracionMensaje}>
                    ¡Gracias por tu excelente servicio!
                  </Text>
                </View>
              ) : (
                <View style={styles.valoracionPendiente}>
                  <Text style={styles.valoracionLabel}>
                    El comprador aún no ha valorado esta venta
                  </Text>
                  <Text style={styles.valoracionPendienteTexto}>
                    La valoración aparecerá aquí una vez que el comprador
                    complete su evaluación
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Solo mostrar confirmación del comprador si NO está en estados intermedios */}
          {!["pago_pendiente", "envio_pendiente", "en_camino"].includes(
            venta.estado
          ) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confirmación comprador:</Text>
              <Text style={styles.detailValue}>
                {venta.compradorConfirmado ? "Confirmado" : "Pendiente"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de éxito */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¡Éxito!</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSuccess]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.modalButtonSuccessText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Modal de error */}
      <Modal
        visible={showErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowErrorModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Modal de confirmación para confirmar pago */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar pago</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que ya recibiste el pago por parte del comprador?
            </Text>
            <Text style={styles.modalMessage}>
              Al confirmar, el pedido pasará a estado Pendiente de envío
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSuccess]}
                onPress={() => {
                  setShowConfirmModal(false);
                  confirmarPagoVendedor();
                }}
              >
                <Text style={styles.modalButtonSuccessText}>
                  Confirmar pago
                </Text>
              </TouchableOpacity>
            </View>
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

      {/* Modal de confirmación para cancelar venta */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCancelModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar cancelación</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que quieres cancelar esta venta?
            </Text>
            <Text style={styles.modalWarning}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCancelModal(false)}
                disabled={canceling}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={confirmarCancelarVenta}
                disabled={canceling}
              >
                <Text style={styles.modalButtonDeleteText}>
                  {canceling ? "Cancelando..." : "Eliminar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Estilos del modal de confirmación
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#3B2412",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: 14,
    color: "#d32f2f",
    marginBottom: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  modalButtonDelete: {
    backgroundColor: "#d32f2f",
  },
  modalButtonCancelText: {
    color: "#3B2412",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalButtonDeleteText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  waitingMessage: {
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
    alignItems: "center",
  },
  waitingText: {
    color: "#1976d2",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  valoracionSection: {
    paddingHorizontal: 18,
    marginBottom: 20,
    ...(Platform.OS === "web" && {
      maxWidth: 800,
      alignSelf: "center",
      width: "100%",
    }),
  },
  valoracionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
    textAlign: "center",
    marginBottom: 16,
  },
  valoracionRecibida: {
    backgroundColor: "#fff4e4",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  valoracionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 8,
  },
  estrellasValoracion: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    paddingVertical: 8,
  },
  estrella: {
    fontSize: 32,
    color: "#ffd700",
    marginHorizontal: 8,
  },
  estrellaLlena: {
    color: "#ffd700",
  },
  estrellaVacia: {
    color: "#e0e0e0",
  },
  valoracionTexto: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 8,
  },
  valoracionMensaje: {
    fontSize: 14,
    color: "#3B2412",
    textAlign: "center",
    fontStyle: "italic",
  },
  valoracionPendiente: {
    backgroundColor: "#fff4e4",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  valoracionPendienteTexto: {
    fontSize: 14,
    color: "#7c4a2d",
    textAlign: "center",
    marginTop: 8,
  },
  modalButtonSuccess: {
    backgroundColor: "#4CAF50",
  },
  modalButtonSuccessText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
