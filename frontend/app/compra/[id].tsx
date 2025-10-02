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
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../constants/ApiConfig";
import CustomTabBar from "../../components/CustomTabBar";
import {
  getEstadoColorObject,
  getEstadoText,
} from "../../constants/EstadoColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Compra {
  id: number;
  estado: string;
  tipoEntrega: string;
  precio: number;
  fechaCompra: string;
  compradorConfirmado: boolean;
  vendedorConfirmado: boolean;
  compradorId: number;
  vendedorId: number;
  valoracionComprador?: number; // Valoración del 1 al 5
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [valoracion, setValoracion] = useState<number>(0);
  const [valorando, setValorando] = useState(false);
  const [showValoracionModal, setShowValoracionModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isComprador, setIsComprador] = useState(false);
  const [isVendedor, setIsVendedor] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      await getCurrentUserId();
      await fetchCompra();
    };
    initializeData();
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

        // Obtener el userId del token para establecer isComprador e isVendedor
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const userId = payload.userId;
            setIsComprador(userId === data.compradorId);
            setIsVendedor(userId === data.vendedorId);
            console.log(
              "Usuario actual:",
              userId,
              "Comprador:",
              data.compradorId,
              "Vendedor:",
              data.vendedorId
            );
            console.log(
              "isComprador:",
              userId === data.compradorId,
              "isVendedor:",
              userId === data.vendedorId
            );
          } catch (error) {
            console.error("Error decodificando token:", error);
          }
        }
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

  // Función para obtener el ID del usuario actual desde el token
  const getCurrentUserId = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Decodificar el token JWT para obtener el userId
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.userId;
        setCurrentUserId(userId);
      }
    } catch (error) {
      console.error("Error obteniendo ID del usuario:", error);
    }
  };

  const handleTransaccionRealizada = async () => {
    console.log("[Compra] Botón presionado, iniciando confirmación...");
    setShowConfirmModal(true);
  };

  const confirmarTransaccion = async () => {
    console.log("[Compra] Usuario confirmó, iniciando proceso...");
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("[Compra] Token obtenido:", token ? "Sí" : "No");
      console.log("[Compra] ID de compra:", id);
      console.log(
        "[Compra] URL de la API:",
        `${API_BASE_URL}/compras/${id}/confirmar-comprador`
      );

      const response = await fetch(
        `${API_BASE_URL}/compras/${id}/confirmar-comprador`,
        {
          method: "PATCH",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        "[Compra] Respuesta del servidor:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("[Compra] Respuesta exitosa:", responseData);

        setSuccessMessage("Transacción confirmada por el comprador");
        setShowSuccessModal(true);
        fetchCompra(); // Recargar datos
      } else {
        const errorData = await response.json();
        console.log("[Compra] Error del servidor:", errorData);

        if (Platform.OS === "web") {
          alert(
            "Error: " +
              (errorData.error || "No se pudo confirmar la transacción")
          );
        } else {
          Alert.alert(
            "Error",
            errorData.error || "No se pudo confirmar la transacción"
          );
        }
      }
    } catch (error) {
      console.error("[Compra] Error confirmando transacción:", error);

      if (Platform.OS === "web") {
        alert("Error: Error al confirmar la transacción");
      } else {
        Alert.alert("Error", "Error al confirmar la transacción");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleValorarVendedor = async () => {
    if (valoracion === 0) {
      Alert.alert("Error", "Debes seleccionar una valoración");
      return;
    }

    try {
      setValorando(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/compras/${id}/valorar-vendedor`,
        {
          method: "PATCH",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ valoracion }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("[Compra] Vendedor valorado:", data);

        setSuccessMessage("Vendedor valorado exitosamente");
        setShowSuccessModal(true);
        setShowValoracionModal(false);
        setValoracion(0);

        // Recargar los datos de la compra
        fetchCompra();
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.error || "No se pudo valorar al vendedor"
        );
      }
    } catch (error) {
      console.error("[Compra] Error valorando vendedor:", error);
      Alert.alert("Error", "Error al valorar al vendedor");
    } finally {
      setValorando(false);
    }
  };

  // Función para que el vendedor confirme la recepción del pago
  const confirmarPagoVendedor = async () => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/compras/${id}/confirmar-pago-vendedor`,
        {
          method: "PATCH",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setSuccessMessage("Pago confirmado exitosamente");
        setShowSuccessModal(true);
        fetchCompra(); // Recargar datos
      } else {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "No se pudo confirmar el pago");
      }
    } catch (error) {
      console.error("Error confirmando pago:", error);
      Alert.alert("Error", "Error al confirmar el pago");
    } finally {
      setUpdating(false);
    }
  };

  // Función para que el comprador confirme que recibió el comprobante de envío
  const confirmarComprobanteEnvioComprador = async () => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/compras/${id}/confirmar-envio-comprador`,
        {
          method: "PATCH",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setSuccessMessage("Información de envío confirmada exitosamente");
        setShowSuccessModal(true);
        fetchCompra(); // Recargar datos
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.error || "No se pudo confirmar la información de envío"
        );
      }
    } catch (error) {
      console.error("Error confirmando información de envío:", error);
      Alert.alert("Error", "Error al confirmar la información de envío");
    } finally {
      setUpdating(false);
    }
  };

  // Función para que el comprador confirme la recepción del envío en buen estado
  const confirmarRecepcionEnvio = async () => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/compras/${id}/confirmar-comprador`,
        {
          method: "PATCH",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setSuccessMessage("Recepción del envío confirmada exitosamente");
        setShowSuccessModal(true);
        fetchCompra(); // Recargar datos
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.error || "No se pudo confirmar la recepción del envío"
        );
      }
    } catch (error) {
      console.error("Error confirmando recepción del envío:", error);
      Alert.alert("Error", "Error al confirmar la recepción del envío");
    } finally {
      setUpdating(false);
    }
  };

  // Función para que el comprador confirme la recepción del libro y complete la compra
  const confirmarRecepcionLibro = async () => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/compras/${id}/confirmar-comprador`,
        {
          method: "PATCH",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setSuccessMessage(
          "Recepción del libro confirmada exitosamente. La compra ha sido completada."
        );
        setShowSuccessModal(true);
        fetchCompra(); // Recargar datos
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Error",
          errorData.error || "No se pudo confirmar la recepción del libro"
        );
      }
    } catch (error) {
      console.error("Error confirmando recepción del libro:", error);
      Alert.alert("Error", "Error al confirmar la recepción del libro");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelarCompra = async () => {
    setShowCancelModal(true);
  };

  const confirmarCancelarCompra = async () => {
    try {
      setCanceling(true);
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/compras/${id}/cancelar`, {
        method: "PATCH",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

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
      setCanceling(false);
      setShowCancelModal(false);
    }
  };

  // Usar funciones centralizadas para colores y textos de estado

  const getInstrucciones = (tipoEntrega: string, estado: string) => {
    if (estado === "completado") {
      return "Esta transacción ha sido completada exitosamente.";
    }

    if (tipoEntrega === "encuentro") {
      if (estado === "comprador_confirmado") {
        return "El comprador ya confirmó la transacción. Confirma que recibiste el pago para completar la transacción.";
      } else if (estado === "vendedor_confirmado") {
        return "El vendedor ya confirmó el pago. Confirma que recibiste el libro para completar la transacción.";
      } else {
        return "Presione el siguiente botón si ya realizó el pago del libro y recibió el mismo en condiciones. Debe coordinar el encuentro con el vendedor.";
      }
    } else if (tipoEntrega === "envio") {
      // Instrucciones específicas para envío
      if (estado === "pago_pendiente") {
        return "Ahora debes realizar el pago del libro, coordinar con el vendedor";
      } else if (estado === "envio_pendiente") {
        return "Presione el siguiente botón si ya recibio la informacion del envio por parte del vendedor";
      } else if (estado === "en_camino") {
        return "El envío está en camino. Una vez que recibas el libro en condiciones y como acordo con el vendedor, confirma que llegó en buen estado. Si hay algun inconveniente comunicarse con soporte.";
      } else if (estado === "comprador_confirmado") {
        return "Solo apriete el botón si recibió el libro en condiciones y como acordó con el vendedor.";
      }
      return "Presione el siguiente botón si ya realizó el pago del libro y lo recibió en buenas condiciones.";
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

  // Log para debugging
  console.log("Render de CompraDetalleScreen:", {
    compra: compra
      ? {
          id: compra.id,
          estado: compra.estado,
          tipoEntrega: compra.tipoEntrega,
          compradorId: compra.compradorId,
          vendedorId: compra.vendedorId,
        }
      : null,
    currentUserId,
    isComprador,
    isVendedor,
    loading,
    error,
  });

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
          onPress={() => router.replace("/historial-compras")}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        {compra.estado !== "completado" && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelarCompra}
            disabled={updating}
          >
            <Text style={styles.cancelButtonText}>Cancelar compra</Text>
          </TouchableOpacity>
        )}
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
                {compra.vendedor.puntuacionVendedor.toFixed(1)} ⭐
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
            <View
              style={[styles.estadoTag, getEstadoColorObject(compra.estado)]}
            >
              <Text style={styles.estadoText}>
                {getEstadoText(compra.estado)}
              </Text>
            </View>
          </View>

          <Text style={styles.instructions}>
            {getInstrucciones(compra.tipoEntrega, compra.estado)}
          </Text>

          {/* Botón para vendedor confirmar pago - para envío en estado pago_pendiente */}
          {(() => {
            const shouldShowButton =
              compra.tipoEntrega === "envio" &&
              compra.estado === "pago_pendiente" &&
              isVendedor;

            console.log(
              "Condiciones del botón de confirmar pago vendedor (envío):",
              {
                tipoEntrega: compra.tipoEntrega,
                estado: compra.estado,
                isVendedor,
                shouldShowButton,
              }
            );

            return shouldShowButton ? (
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  updating && styles.completeButtonDisabled,
                ]}
                onPress={confirmarPagoVendedor}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.completeButtonText}>
                    Confirmar recepción del pago
                  </Text>
                )}
              </TouchableOpacity>
            ) : null;
          })()}

          {/* Botón para vendedor confirmar pago - para encuentro en estado comprador_confirmado */}
          {(() => {
            const shouldShowButton =
              compra.tipoEntrega === "encuentro" &&
              compra.estado === "comprador_confirmado" &&
              isVendedor;

            console.log(
              "Condiciones del botón de confirmar pago vendedor (encuentro):",
              {
                tipoEntrega: compra.tipoEntrega,
                estado: compra.estado,
                isVendedor,
                shouldShowButton,
              }
            );

            return shouldShowButton ? (
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  updating && styles.completeButtonDisabled,
                ]}
                onPress={confirmarPagoVendedor}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.completeButtonText}>Pago recibido</Text>
                )}
              </TouchableOpacity>
            ) : null;
          })()}

          {/* Botón para comprador confirmar comprobante de envío - solo para envío en estado envio_pendiente */}
          {(() => {
            const shouldShowButton =
              compra.tipoEntrega === "envio" &&
              compra.estado === "envio_pendiente" &&
              isComprador;

            console.log("Condiciones del botón de información de envío:", {
              tipoEntrega: compra.tipoEntrega,
              estado: compra.estado,
              isComprador,
              shouldShowButton,
            });

            return shouldShowButton ? (
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  updating && styles.completeButtonDisabled,
                ]}
                onPress={confirmarComprobanteEnvioComprador}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.completeButtonText}>
                    Información de envío recibida
                  </Text>
                )}
              </TouchableOpacity>
            ) : null;
          })()}

          {/* Botón para comprador confirmar recepción del envío - solo para envío en estado en_camino */}
          {(() => {
            const shouldShowButton =
              compra.tipoEntrega === "envio" &&
              compra.estado === "en_camino" &&
              isComprador;

            console.log(
              "Condiciones del botón de confirmar recepción del envío:",
              {
                tipoEntrega: compra.tipoEntrega,
                estado: compra.estado,
                isComprador,
                shouldShowButton,
              }
            );

            return shouldShowButton ? (
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  updating && styles.completeButtonDisabled,
                ]}
                onPress={confirmarRecepcionEnvio}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.completeButtonText}>
                    Confirmar recepción del envío
                  </Text>
                )}
              </TouchableOpacity>
            ) : null;
          })()}

          {/* Botón para comprador confirmar recepción del libro - solo para envío en estado comprador_confirmado */}
          {(() => {
            const shouldShowButton =
              compra.tipoEntrega === "envio" &&
              compra.estado === "comprador_confirmado" &&
              isComprador;

            console.log(
              "Condiciones del botón de confirmar recepción del libro:",
              {
                tipoEntrega: compra.tipoEntrega,
                estado: compra.estado,
                isComprador,
                shouldShowButton,
              }
            );

            return shouldShowButton ? (
              <TouchableOpacity
                style={[
                  styles.completeButton,
                  updating && styles.completeButtonDisabled,
                ]}
                onPress={confirmarRecepcionLibro}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.completeButtonText}>
                    Confirmar recepción del libro
                  </Text>
                )}
              </TouchableOpacity>
            ) : null;
          })()}

          {/* Lógica original para encuentro */}
          {(compra.estado === "encuentro" ||
            compra.estado === "vendedor_confirmado") &&
            !compra.compradorConfirmado && (
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
                    {compra.estado === "vendedor_confirmado"
                      ? "Confirmar recepción"
                      : "Transacción realizada"}
                  </Text>
                )}
              </TouchableOpacity>
            )}

          {/* Mensajes de espera */}
          {compra.tipoEntrega === "envio" && (
            <>
              {isComprador && compra.estado === "pago_pendiente" && (
                <View style={styles.waitingMessage}>
                  <Text style={styles.waitingText}>
                    Esperando confirmación del pago por parte del vendedor...
                  </Text>
                </View>
              )}

              {isComprador && compra.estado === "envio_pendiente" && (
                <View style={styles.waitingMessage}>
                  <Text style={styles.waitingText}>
                    El vendedor debe realizar el envío y enviarte la
                    información. Una vez que la recibas, confirma con el botón
                    de arriba.
                  </Text>
                </View>
              )}

              {isComprador && compra.estado === "en_camino" && (
                <View style={styles.waitingMessage}>
                  <Text style={styles.waitingText}>
                    El envío está en camino. Debes esperar a que llegue y luego
                    confirmar que recibiste el libro en buen estado.
                  </Text>
                </View>
              )}

              {isComprador && compra.estado === "comprador_confirmado" && (
                <View style={styles.waitingMessage}>
                  <Text style={styles.waitingText}>
                    Solo apriete el botón si recibió el libro en condiciones y
                    como acordó con el vendedor.
                  </Text>
                </View>
              )}

              {isVendedor && compra.estado === "envio_pendiente" && (
                <View style={styles.waitingMessage}>
                  <Text style={styles.waitingText}>
                    Debe despachar el envío y enviarle al comprador el
                    comprobante de envío
                  </Text>
                </View>
              )}

              {isVendedor && compra.estado === "en_camino" && (
                <View style={styles.waitingMessage}>
                  <Text style={styles.waitingText}>
                    El envío está en camino. Debes esperar a que el comprador
                    confirme que recibió el libro en buen estado.
                  </Text>
                </View>
              )}

              {isVendedor && compra.estado === "comprador_confirmado" && (
                <View style={styles.waitingMessage}>
                  <Text style={styles.waitingText}>
                    El comprador ya confirmó la recepción del envío. Esperando
                    que confirme la recepción del libro.
                  </Text>
                </View>
              )}
            </>
          )}

          {compra.compradorConfirmado && !compra.vendedorConfirmado && (
            <View style={styles.waitingMessage}>
              <Text style={styles.waitingText}>
                Esperando confirmación del vendedor...
              </Text>
            </View>
          )}

          {/* Sección de valoración - solo mostrar si está completada */}
          {compra.estado === "completado" && (
            <View style={styles.valoracionSection}>
              <Text style={styles.valoracionTitle}>Valoración</Text>

              {compra.valoracionComprador ? (
                <View style={styles.valoracionCompletada}>
                  <Text style={styles.valoracionLabel}>
                    Tu valoración al vendedor:
                  </Text>
                  <View style={styles.estrellasValoracion}>
                    {[1, 2, 3, 4, 5].map((estrella) => (
                      <Text
                        key={estrella}
                        style={[
                          styles.estrella,
                          estrella <= compra.valoracionComprador!
                            ? styles.estrellaLlena
                            : styles.estrellaVacia,
                        ]}
                      >
                        ⭐
                      </Text>
                    ))}
                  </View>
                  <Text style={styles.valoracionResumen}>
                    {compra.valoracionComprador}/5 estrellas
                  </Text>
                </View>
              ) : (
                <View style={styles.valoracionPendiente}>
                  <Text style={styles.valoracionTexto}>
                    Selecciona una valoración:
                  </Text>

                  {/* Selector de estrellas */}
                  <View style={styles.estrellasSelector}>
                    {[1, 2, 3, 4, 5].map((estrella) => (
                      <TouchableOpacity
                        key={estrella}
                        style={[
                          styles.estrellaButton,
                          estrella <= valoracion &&
                            styles.estrellaButtonSeleccionada,
                        ]}
                        onPress={() => setValoracion(estrella)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.estrellaSelector,
                            estrella <= valoracion
                              ? styles.estrellaSelectorLlena
                              : styles.estrellaSelectorVacia,
                          ]}
                        >
                          ⭐
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Texto de valoración seleccionada */}
                  {valoracion > 0 && (
                    <Text style={styles.valoracionSeleccionada}>
                      {valoracion} de 5 estrellas
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.valorarButton,
                      valoracion === 0 && styles.valorarButtonDisabled,
                    ]}
                    onPress={handleValorarVendedor}
                    disabled={valoracion === 0 || valorando}
                  >
                    {valorando ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.valorarButtonText}>
                        Valorar vendedor
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Solo mostrar confirmación del vendedor si NO está en estados intermedios */}
          {!["pago_pendiente", "envio_pendiente", "en_camino"].includes(
            compra.estado
          ) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confirmación vendedor:</Text>
              <Text style={styles.detailValue}>
                {compra.vendedorConfirmado ? "Confirmado" : "Pendiente"}
              </Text>
            </View>
          )}
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

      {/* Modal de confirmación para cancelar compra */}
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
              ¿Estás seguro de que quieres cancelar esta compra?
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
                onPress={confirmarCancelarCompra}
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

      {/* Modal de confirmación para transacción realizada */}
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
            <Text style={styles.modalTitle}>Confirmar transacción</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que ya realizaste el pago y recibiste el libro en
              buenas condiciones?
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
                  confirmarTransaccion();
                }}
              >
                <Text style={styles.modalButtonSuccessText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Modal de confirmación exitosa */}
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
  modalButtonSuccess: {
    backgroundColor: "#4caf50",
  },
  modalButtonSuccessText: {
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
  valoracionCompletada: {
    backgroundColor: "#f3e8da",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  valoracionLabel: {
    fontSize: 16,
    color: "#3B2412",
    marginBottom: 12,
    fontWeight: "bold",
  },
  estrellasValoracion: {
    flexDirection: "row",
    marginBottom: 12,
  },
  valoracionResumen: {
    fontSize: 18,
    color: "#3B2412",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  estrella: {
    fontSize: 40,
    color: "#e0e0e0",
    marginHorizontal: 4,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  estrellaLlena: {
    color: "#ffd700", // Color dorado para las estrellas llenas
    textShadowColor: "rgba(255, 215, 0, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  estrellaVacia: {
    color: "#e0e0e0", // Color gris claro para las estrellas vacías
  },
  valoracionTexto: {
    fontSize: 16,
    color: "#3B2412",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  estrellasSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 2,
    paddingHorizontal: 8,
  },
  estrellaButton: {
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 1,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    maxWidth: 50,
  },
  estrellaButtonSeleccionada: {
    borderColor: "#ffd700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    shadowColor: "#ffd700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  estrellaSelector: {
    fontSize: 28,
    textAlign: "center",
    minWidth: 32,
    minHeight: 32,
    lineHeight: 32,
  },
  estrellaSelectorLlena: {
    color: "#ffd700",
    textShadowColor: "rgba(255, 215, 0, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  estrellaSelectorVacia: {
    color: "#b0b0b0",
    opacity: 0.4,
  },
  valoracionSeleccionada: {
    fontSize: 16,
    color: "#3B2412",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  valoracionPendiente: {
    backgroundColor: "#f3e8da",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  valorarButton: {
    backgroundColor: "#3B2412",
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: "center",
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  valorarButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  valorarButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textTransform: "uppercase",
  },
});
