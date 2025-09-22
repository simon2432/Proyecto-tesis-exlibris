import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/ApiConfig";
import ModalDetallePublicacion from "../components/ModalDetallePublicacion";
import { getEstadoColorObject, getEstadoText } from "../constants/EstadoColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MisPublicaciones() {
  const router = useRouter();
  const [tab, setTab] = useState("activas");
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [publicacionesEnProceso, setPublicacionesEnProceso] = useState<any[]>(
    []
  );
  const [ventasCompletadas, setVentasCompletadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPublicacion, setSelectedPublicacion] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [estadosCompras, setEstadosCompras] = useState<{
    [key: number]: string;
  }>({});

  useEffect(() => {
    if (tab === "activas") {
      fetchPublicaciones();
    } else if (tab === "en-proceso") {
      fetchPublicacionesEnProceso();
    } else if (tab === "vendidas") {
      fetchVentasCompletadas();
    }
  }, [tab]);

  const fetchPublicaciones = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/publicaciones/mis`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Solo mostrar las activas
        setPublicaciones(data.filter((p: any) => p.estado === "activa"));
      } else {
        setPublicaciones([]);
      }
    } catch (err) {
      setPublicaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicacionesEnProceso = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      // Obtener publicaciones
      const resPublicaciones = await fetch(
        `${API_BASE_URL}/publicaciones/mis`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );

      if (resPublicaciones.ok) {
        const publicaciones = await resPublicaciones.json();
        console.log(
          "[Mis Publicaciones] Todas las publicaciones:",
          publicaciones
        );

        // Solo mostrar las que están en proceso (estado en_venta)
        // Las vendidas ya no aparecerán aquí porque tienen estado "vendida"
        const enProceso = publicaciones.filter(
          (p: any) => p.estado === "en_venta"
        );

        console.log("[Mis Publicaciones] Publicaciones en proceso:", enProceso);

        setPublicacionesEnProceso(enProceso);

        // Obtener estados de las compras para cada publicación en proceso
        await fetchEstadosCompras(enProceso);
      } else {
        setPublicacionesEnProceso([]);
      }
    } catch (err) {
      console.error(
        "[Mis Publicaciones] Error en fetchPublicacionesEnProceso:",
        err
      );
      setPublicacionesEnProceso([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVentasCompletadas = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      // Obtener publicaciones vendidas directamente
      const res = await fetch(`${API_BASE_URL}/publicaciones/mis`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.ok) {
        const publicaciones = await res.json();
        console.log(
          "[Mis Publicaciones] Todas las publicaciones:",
          publicaciones
        );

        // Solo mostrar las que tienen estado "vendida"
        const vendidas = publicaciones.filter(
          (p: any) => p.estado === "vendida"
        );
        console.log("[Mis Publicaciones] Publicaciones vendidas:", vendidas);

        setVentasCompletadas(vendidas);
      } else {
        setVentasCompletadas([]);
      }
    } catch (err) {
      setVentasCompletadas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadosCompras = async (publicaciones: any[]) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const estados: { [key: number]: string } = {};

      // Obtener estado de compra para cada publicación en paralelo
      const promises = publicaciones.map(async (pub) => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/compras/publicacion/${pub.id}`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
              },
            }
          );
          if (res.ok) {
            const compra = await res.json();
            estados[pub.id] = compra.estado;
          } else {
            // Si no hay compra, usar estado por defecto
            estados[pub.id] = "en_venta";
          }
        } catch (error) {
          console.error(
            `Error obteniendo estado para publicación ${pub.id}:`,
            error
          );
          estados[pub.id] = "en_venta";
        }
      });

      await Promise.all(promises);
      setEstadosCompras(estados);
    } catch (error) {
      console.error("Error obteniendo estados de compras:", error);
    }
  };

  const fetchCompraByPublicacion = async (publicacionId: number) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/compras/publicacion/${publicacionId}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      if (res.ok) {
        const compra = await res.json();
        console.log("[Mis Publicaciones] Compra encontrada:", compra);
        router.push({
          pathname: "/venta/[id]",
          params: { id: compra.id.toString() },
        });
      } else {
        console.error("No se encontró compra para esta publicación");
      }
    } catch (error) {
      console.error("Error buscando compra:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header solo logo a la izquierda y color principal */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/logoLechuza.png")}
          style={styles.logoImg}
        />
      </View>
      {/* Botones debajo del header, alineados a los extremos */}
      <View style={styles.topButtonsRow}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => router.replace("/market")}
        >
          <Text style={styles.topButtonText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => router.replace("/crear-publicacion")}
        >
          <Text style={styles.topButtonText}>Crear publicación</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>
          {tab === "activas"
            ? "Tus publicaciones activas"
            : tab === "en-proceso"
            ? "Tus publicaciones en proceso"
            : "Tus publicaciones vendidas"}
        </Text>
        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "activas" && styles.tabBtnActive]}
            onPress={() => setTab("activas")}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === "activas" && styles.tabBtnTextActive,
              ]}
            >
              Activas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "en-proceso" && styles.tabBtnActive]}
            onPress={() => setTab("en-proceso")}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === "en-proceso" && styles.tabBtnTextActive,
              ]}
            >
              En proceso
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "vendidas" && styles.tabBtnActive]}
            onPress={() => setTab("vendidas")}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === "vendidas" && styles.tabBtnTextActive,
              ]}
            >
              Vendidas
            </Text>
          </TouchableOpacity>
        </View>
        {/* Mostrar grilla según el tab seleccionado */}
        {tab === "activas" &&
          (loading ? (
            <ActivityIndicator
              size="large"
              color="#7c4a2d"
              style={{ marginTop: 40 }}
            />
          ) : publicaciones.length === 0 ? (
            <Text
              style={{
                color: "#a08b7d",
                fontStyle: "italic",
                textAlign: "center",
                marginTop: 30,
              }}
            >
              No tienes publicaciones activas.
            </Text>
          ) : (
            <View style={styles.grid}>
              {publicaciones.map((pub) => (
                <TouchableOpacity
                  key={pub.id}
                  style={styles.bookCard}
                  onPress={() => {
                    setSelectedPublicacion(pub);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  {pub.imagenUrl ? (
                    <Image
                      source={{ uri: `${API_BASE_URL}${pub.imagenUrl}` }}
                      style={styles.imagePlaceholder}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder} />
                  )}
                  <View style={styles.priceTagShadow}>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>
                        ${pub.precio.toLocaleString("es-ES")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.pubTitle} numberOfLines={2}>
                    {pub.titulo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        {tab === "en-proceso" &&
          (loading ? (
            <ActivityIndicator
              size="large"
              color="#7c4a2d"
              style={{ marginTop: 40 }}
            />
          ) : publicacionesEnProceso.length === 0 ? (
            <Text
              style={{
                color: "#a08b7d",
                fontStyle: "italic",
                textAlign: "center",
                marginTop: 30,
              }}
            >
              No tienes publicaciones en proceso.
            </Text>
          ) : (
            <View style={styles.grid}>
              {publicacionesEnProceso.map((pub) => (
                <TouchableOpacity
                  key={pub.id}
                  style={styles.bookCard}
                  onPress={() => {
                    // Buscar la compra asociada a esta publicación
                    fetchCompraByPublicacion(pub.id);
                  }}
                  activeOpacity={0.8}
                >
                  {pub.imagenUrl ? (
                    <Image
                      source={{ uri: `${API_BASE_URL}${pub.imagenUrl}` }}
                      style={styles.imagePlaceholder}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder} />
                  )}
                  <View style={styles.priceTagShadow}>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>
                        ${pub.precio.toLocaleString("es-ES")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.pubTitle} numberOfLines={2}>
                    {pub.titulo}
                  </Text>
                  {/* Chip de estado de la compra */}
                  <View
                    style={[
                      styles.estadoTag,
                      getEstadoColorObject(
                        estadosCompras[pub.id] || "en_venta"
                      ),
                    ]}
                  >
                    <Text style={styles.estadoText}>
                      {getEstadoText(estadosCompras[pub.id] || "en_venta")}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        {tab === "vendidas" &&
          (loading ? (
            <ActivityIndicator
              size="large"
              color="#7c4a2d"
              style={{ marginTop: 40 }}
            />
          ) : ventasCompletadas.length === 0 ? (
            <Text
              style={{
                color: "#a08b7d",
                fontStyle: "italic",
                textAlign: "center",
                marginTop: 30,
              }}
            >
              No tienes ventas completadas.
            </Text>
          ) : (
            <View style={styles.grid}>
              {ventasCompletadas.map((publicacion) => (
                <TouchableOpacity
                  key={publicacion.id}
                  style={styles.bookCard}
                  onPress={() => {
                    // Navegar a la pantalla de venta completada
                    // Necesitamos obtener el ID de la compra primero
                    fetchCompraByPublicacion(publicacion.id);
                  }}
                  activeOpacity={0.8}
                >
                  {publicacion.imagenUrl ? (
                    <Image
                      source={{
                        uri: `${API_BASE_URL}${publicacion.imagenUrl}`,
                      }}
                      style={styles.imagePlaceholder}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.placeholderText}>Sin imagen</Text>
                    </View>
                  )}
                  <View style={styles.priceTagShadow}>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>
                        ${publicacion.precio.toLocaleString("es-ES")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.pubTitle} numberOfLines={2}>
                    {publicacion.titulo || "Sin título"}
                  </Text>
                  <Text style={styles.ventaEstado}>Vendida</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </ScrollView>
      <ModalDetallePublicacion
        visible={modalVisible}
        publicacion={selectedPublicacion}
        onClose={() => setModalVisible(false)}
        onEdit={() => {
          setModalVisible(false);
          if (selectedPublicacion) {
            router.replace(`/editar-publicacion?id=${selectedPublicacion.id}`);
          }
        }}
      />
    </View>
  );
}

const CARD_GAP = 18;
const CARD_WIDTH_PERCENT = Platform.OS === "web" ? "29%" : "28%";
const CARD_HEIGHT = 170;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff4e4",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 18,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  logo: {
    fontWeight: "bold",
    fontSize: 22,
    color: "#7c4a2d",
    letterSpacing: 1,
  },
  logoImg: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 8,
    marginHorizontal: 18,
  },
  topButton: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minWidth: 120,
    alignItems: "center",
  },
  topButtonText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 15,
  },
  title: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
    marginTop: 18,
    marginBottom: 18,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 18,
  },
  tabBtn: {
    backgroundColor: "#f3e8da",
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 7,
  },
  tabBtnActive: {
    backgroundColor: "#3B2412",
  },
  tabBtnText: {
    color: "#3B2412",
    fontWeight: "bold",
    fontSize: 15,
  },
  tabBtnTextActive: {
    color: "#fff4e4",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: CARD_GAP,
    paddingHorizontal: 6,
  },
  bookCard: {
    width: CARD_WIDTH_PERCENT,
    minWidth: 90,
    maxWidth: 140,
    height: CARD_HEIGHT,
    backgroundColor: "#fff4e4",
    borderRadius: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 110,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#e9e3de",
  },
  priceTagShadow: {
    marginTop: -18,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 12,
  },
  priceTag: {
    backgroundColor: "#f3e8da",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 6,
    minWidth: 80,
    alignItems: "center",
  },
  priceText: {
    color: "#7c4a2d",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  pubTitle: {
    fontSize: 14,
    color: "#3B2412",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 0,
    paddingHorizontal: 2,
  },
  ventaEstado: {
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
  },
  placeholderText: {
    color: "#7c4a2d",
    fontSize: 14,
  },
  estadoTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: "center",
    alignItems: "center",
    marginHorizontal: 12,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
});
