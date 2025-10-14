import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../../constants/ApiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LibroDetalleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const libro: any = params;

  const [descripcion, setDescripcion] = useState(libro.description || "");
  const [descripcionGenerada, setDescripcionGenerada] = useState(
    libro.descriptionGenerated === "true" || libro.descriptionGenerated === true
  );
  const [resenas, setResenas] = useState<any[]>([]);
  const [spoilerVisible, setSpoilerVisible] = useState<{
    [id: number]: boolean;
  }>({});
  const [promedio, setPromedio] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [avatarError, setAvatarError] = useState<{ [id: number]: boolean }>({});

  useEffect(() => {
    if (!libro.description || libro.description.trim() === "") {
      axios
        .post(`${API_BASE_URL}/books/generate-description`, {
          title: libro.title,
          authors: libro.authors,
          publisher: libro.publisher,
          publishedDate: libro.publishedDate,
          categories: libro.categories,
          language: libro.language,
          pageCount: libro.pageCount,
        })
        .then((res) => {
          if (
            res.data &&
            res.data.description &&
            res.data.description !== "Descripción no disponible" &&
            res.data.description !== "Descripción no encontrada"
          ) {
            setDescripcion(res.data.description.trim());
            setDescripcionGenerada(true);
          } else {
            // Si no se pudo generar descripción, dejar vacío
            setDescripcion("");
            setDescripcionGenerada(false);
          }
        })
        .catch((error) => {
          console.error("Error generando descripción:", error);
          setDescripcion("");
          setDescripcionGenerada(false);
        });
    }
    // Obtener userId actual
    AsyncStorage.getItem("user").then((user) => {
      if (user) {
        try {
          const parsed = JSON.parse(user);
          setUserId(parsed.id);
        } catch {}
      }
    });
    // Fetch reseñas
    axios.get(`${API_BASE_URL}/lecturas/reviews/${libro.id}`).then((res) => {
      setResenas(res.data.resenas || []);
      if (res.data.resenas && res.data.resenas.length > 0) {
        const sum = res.data.resenas.reduce(
          (acc: number, r: any) => acc + (r.reviewRating || 0),
          0
        );
        setPromedio(sum / res.data.resenas.length);
        setTotal(res.data.resenas.length);
      } else {
        setPromedio(0);
        setTotal(0);
      }
    });
  }, [
    libro.title,
    libro.authors,
    libro.description,
    libro.publisher,
    libro.publishedDate,
    libro.categories,
    libro.language,
    libro.pageCount,
    libro.id,
  ]);

  const handleAgregarLectura = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/lecturas`,
        {
          libroId: libro.id,
          titulo: libro.title,
          portada: libro.image,
          fechaInicio: new Date(),
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.data && res.data.id) {
        router.push("/perfil");
      } else {
        Alert.alert("Error", "No se pudo agregar la lectura.");
      }
    } catch (err) {
      console.error("Error agregando lectura:", err);
      Alert.alert("Error", "No se pudo agregar la lectura.");
    }
  };

  const renderField = (label: string, value: string | undefined) => {
    if (!value || value.trim() === "") return null;
    return (
      <Text style={styles.bookMeta}>
        <Text style={styles.bold}>{label}:</Text> {value}
      </Text>
    );
  };

  // Función para obtener la URL absoluta de la foto de perfil
  const getFotoPerfilUrl = (fotoPerfil: string | null | undefined) => {
    if (!fotoPerfil) return require("../../assets/images/perfil.png");
    if (fotoPerfil.startsWith("http")) return { uri: fotoPerfil };
    // Si es relativa, prepende el dominio del backend
    return {
      uri: `${API_BASE_URL.replace(/\/$/, "")}/${fotoPerfil.replace(
        /^\//,
        ""
      )}`,
    };
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAgregarLectura}
        >
          <Text style={styles.addButtonText}>Agregar al historial lector</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.mainContainer}>
          <View style={styles.bookInfoRow}>
            {libro.image && (
              <Image source={{ uri: libro.image }} style={styles.bookImage} />
            )}
            <View style={styles.bookInfoCol}>
              <Text style={styles.bookTitle}>{libro.title}</Text>
              {renderField("Autor", libro.authors)}
              {renderField("Género", libro.categories)}
              {renderField("Editorial", libro.publisher)}
              {renderField("Fecha de publicación", libro.publishedDate)}
              {renderField("Páginas", libro.pageCount)}
              {renderField("Idioma", libro.language)}
            </View>
          </View>

          {descripcion && (
            <>
              <Text style={styles.sectionTitle}>Descripción:</Text>
              <Text style={styles.description}>{descripcion}</Text>
              {descripcionGenerada && (
                <Text style={styles.generatedMessage}>
                  📚 Descripción generada por asistente conversacional
                </Text>
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>
            Reseñas{total > 0 ? ` (${total})` : ""}
          </Text>
          {total === 0 && (
            <View style={styles.reviewsPlaceholder}>
              <Text style={{ color: "#a08b7d", fontStyle: "italic" }}>
                Aquí aparecerán las reseñas de los usuarios.
              </Text>
            </View>
          )}
          {total > 0 && (
            <View style={{ marginHorizontal: 18, marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    color: "#3B2412",
                    fontSize: 16,
                    marginRight: 8,
                  }}
                >
                  Valoración promedio:
                </Text>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text
                    key={star}
                    style={{
                      fontSize: 18,
                      color: promedio >= star ? "#FFD700" : "#CCC",
                    }}
                  >
                    ★
                  </Text>
                ))}
                <Text style={{ marginLeft: 8, color: "#3B2412", fontSize: 15 }}>
                  {promedio.toFixed(1)}
                </Text>
              </View>
              <ScrollView style={{ maxHeight: 350 }}>
                {resenas.map((r) => (
                  <View
                    key={r.id}
                    style={[
                      styles.reviewCard,
                      userId === r.userId && styles.reviewCardOwn,
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <ExpoImage
                        source={
                          avatarError[r.id] || !r.fotoPerfil
                            ? require("../../assets/images/perfil.png")
                            : getFotoPerfilUrl(r.fotoPerfil)
                        }
                        style={styles.reviewAvatar}
                        contentFit="cover"
                        onError={() =>
                          setAvatarError((e) => ({ ...e, [r.id]: true }))
                        }
                      />
                      <Text style={styles.reviewUser}>
                        {r.nombre || "Usuario"}
                      </Text>
                      <View style={{ flexDirection: "row", marginLeft: 8 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text
                            key={star}
                            style={{
                              fontSize: 15,
                              color:
                                r.reviewRating >= star ? "#FFD700" : "#CCC",
                            }}
                          >
                            ★
                          </Text>
                        ))}
                      </View>
                    </View>
                    <View style={{ position: "relative" }}>
                      {r.esSpoiler ? (
                        <TouchableOpacity
                          activeOpacity={1}
                          onPress={() =>
                            setSpoilerVisible((s) => ({
                              ...s,
                              [r.id]: !s[r.id],
                            }))
                          }
                          style={{ minHeight: 36 }}
                        >
                          <Text
                            style={[
                              styles.reviewText,
                              {
                                color: "#3B2412",
                                opacity: spoilerVisible[r.id] ? 1 : 0.3,
                              },
                            ]}
                          >
                            {r.reviewComment}
                          </Text>
                          {!spoilerVisible[r.id] && (
                            <BlurView
                              intensity={100}
                              tint="dark"
                              style={[
                                StyleSheet.absoluteFill,
                                {
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  backgroundColor: "rgba(60,60,60,0.85)",
                                },
                              ]}
                              pointerEvents="none"
                            >
                              <Text
                                style={{
                                  color: "#F8F2E9",
                                  fontWeight: "bold",
                                  fontSize: 22,
                                  textShadowColor: "rgba(0,0,0,0.4)",
                                  textShadowOffset: { width: 0, height: 2 },
                                  textShadowRadius: 4,
                                }}
                              >
                                Alerta de espoiler
                              </Text>
                            </BlurView>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.reviewText}>{r.reviewComment}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF4E4",
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFF4E4",
  },
  logo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    letterSpacing: 1.5,
  },
  backButton: {
    backgroundColor: "#7c4a2d",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  addButton: {
    backgroundColor: "#332018",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  addButtonText: {
    color: "#f3e8da",
    fontWeight: "bold",
    fontSize: 15,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  mainContainer: {
    ...(Platform.OS === "web" && {
      maxWidth: 800,
      alignSelf: "center",
      width: "100%",
    }),
  },
  bookInfoContainer: {
    ...(Platform.OS === "web" && {
      maxWidth: 800,
      alignSelf: "center",
      width: "100%",
    }),
  },
  bookInfoRow: {
    flexDirection: "row",
    marginTop: 18,
    marginHorizontal: 18,
    alignItems: "flex-start",
  },
  bookImage: {
    width: 120,
    height: 170,
    borderRadius: 10,
    marginRight: 18,
    backgroundColor: "#FFF4E4",
  },
  bookInfoCol: {
    flex: 1,
    justifyContent: "flex-start",
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 6,
  },
  bookMeta: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
  bold: {
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#3B2412",
    marginTop: 18,
    marginBottom: 6,
    marginLeft: 18,
  },
  description: {
    fontSize: 15,
    color: "#3B2412",
    marginHorizontal: 18,
    marginBottom: 10,
    textAlign: "justify",
  },
  generatedMessage: {
    fontSize: 12,
    color: "#a08b7d",
    fontStyle: "italic",
    marginHorizontal: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  reviewsPlaceholder: {
    minHeight: 80,
    backgroundColor: "#FFF4E4",
    borderRadius: 12,
    marginHorizontal: 18,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  reviewCard: {
    backgroundColor: "#FFF4E4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewCardOwn: {
    backgroundColor: "#FFF4E4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewUser: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#3B2412",
  },
  reviewText: {
    fontSize: 15,
    color: "#3B2412",
  },
});
