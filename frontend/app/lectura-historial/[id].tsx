import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../../constants/ApiConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Precargar imagen placeholder
const preloadPlaceholder = () => {
  ExpoImage.prefetch("https://placehold.co/120x170");
};
export default function LecturaHistorialDetalle() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [lectura, setLectura] = useState<any>(null);
  const [showInicio, setShowInicio] = useState(false);
  const [showFin, setShowFin] = useState(false);
  const [libro, setLibro] = useState<any>(null);
  const [descripcion, setDescripcion] = useState<string>("");
  const [descripcionGenerada, setDescripcionGenerada] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Precargar imagen placeholder
    preloadPlaceholder();

    const fetchLectura = async () => {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/lecturas/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setLectura(res.data);
      // Obtener datos reales del libro usando el libroId de la lectura
      if (res.data && res.data.libroId) {
        try {
          const libroRes = await axios.get(
            `https://www.googleapis.com/books/v1/volumes/${res.data.libroId}`
          );
          setLibro(libroRes.data.volumeInfo);
          if (
            libroRes.data.volumeInfo?.description &&
            libroRes.data.volumeInfo.description.trim() !== ""
          ) {
            setDescripcion(libroRes.data.volumeInfo.description.trim());
            setDescripcionGenerada(false);
          } else {
            // Generar descripción desde el backend
            await axios
              .post(`${API_BASE_URL}/books/generate-description`, {
                title: libroRes.data.volumeInfo.title,
                authors: libroRes.data.volumeInfo.authors,
                publisher: libroRes.data.volumeInfo.publisher,
                publishedDate: libroRes.data.volumeInfo.publishedDate,
                categories: libroRes.data.volumeInfo.categories,
                language: libroRes.data.volumeInfo.language,
                pageCount: libroRes.data.volumeInfo.pageCount,
              })
              .then((descRes) => {
                if (
                  descRes.data &&
                  descRes.data.description &&
                  descRes.data.description !== "Descripción no encontrada"
                ) {
                  setDescripcion(descRes.data.description.trim());
                  setDescripcionGenerada(true);
                } else {
                  setDescripcion("");
                  setDescripcionGenerada(false);
                }
              })
              .catch(() => {
                setDescripcion("");
                setDescripcionGenerada(false);
              });
          }
        } catch {}
      }
    };
    fetchLectura();
  }, [id]);

  const handleChangeInicio = (event: any, date?: Date) => {
    setShowInicio(false);
    if (date) {
      axios
        .put(`${API_BASE_URL}/lecturas/${id}`, { fechaInicio: date })
        .then((res) => setLectura(res.data));
    }
  };
  const handleChangeFin = (event: any, date?: Date) => {
    setShowFin(false);
    if (date) {
      axios
        .put(`${API_BASE_URL}/lecturas/${id}`, { fechaFin: date })
        .then((res) => setLectura(res.data));
    }
  };

  const handleDeleteLectura = async () => {
    setIsDeleting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/lecturas/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Cerrar modal y navegar directamente al perfil
      setShowDeleteModal(false);
      setIsDeleting(false);

      // Pequeño delay para asegurar que el modal se cierre antes de navegar
      setTimeout(() => {
        router.replace("/perfil");
      }, 100);
    } catch (error) {
      console.error("Error al eliminar lectura:", error);
      Alert.alert(
        "Error",
        "No se pudo eliminar el libro del historial. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
      setIsDeleting(false);
    }
  };

  if (!lectura) return <Text>Cargando...</Text>;

  return (
    <ScrollView style={{ backgroundColor: "#FFF" }}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBtnText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtnDanger}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={styles.headerBtnText}>Eliminar libro del historial</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.mainRow}>
        <ExpoImage
          source={{
            uri:
              libro?.imageLinks?.thumbnail ||
              libro?.imageLinks?.smallThumbnail ||
              "https://placehold.co/120x170",
          }}
          style={styles.cover}
          placeholder="https://placehold.co/120x170"
          contentFit="cover"
          transition={200}
        />
        <View style={styles.infoCol}>
          <Text style={styles.title}>{libro?.title || "Sin título"}</Text>
          <Text style={styles.meta}>
            <Text style={styles.bold}>Autor:</Text>{" "}
            {libro?.authors?.join(", ") || "-"}
          </Text>
          <Text style={styles.meta}>
            <Text style={styles.bold}>Género:</Text>{" "}
            {libro?.categories?.join(", ") || "-"}
          </Text>
          <Text style={styles.meta}>
            <Text style={styles.bold}>Editorial:</Text>{" "}
            {libro?.publisher || "-"}
          </Text>
          <Text style={styles.meta}>
            <Text style={styles.bold}>Cantidad de páginas:</Text>{" "}
            {libro?.pageCount || "-"}
          </Text>
          <Text style={styles.meta}>
            <Text style={styles.bold}>Idioma:</Text> {libro?.language || "-"}
          </Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowInicio(true)}
            >
              <Text style={styles.dateBtnText}>
                Fecha de inicio:{" "}
                {lectura.fechaInicio
                  ? new Date(lectura.fechaInicio).toLocaleDateString()
                  : "-"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowFin(true)}
            >
              <Text style={styles.dateBtnText}>
                Fecha de fin:{" "}
                {lectura.fechaFin
                  ? new Date(lectura.fechaFin).toLocaleDateString()
                  : "-"}
              </Text>
            </TouchableOpacity>
          </View>
          {showInicio && (
            <DateTimePicker
              value={
                lectura.fechaInicio ? new Date(lectura.fechaInicio) : new Date()
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleChangeInicio}
            />
          )}
          {showFin && (
            <DateTimePicker
              value={lectura.fechaFin ? new Date(lectura.fechaFin) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleChangeFin}
            />
          )}
        </View>
      </View>
      <View style={styles.sectionBox}>
        <Text style={styles.sectionLabel}>Descripción:</Text>
        <Text style={styles.description}>
          {descripcion || "Sin descripción"}
        </Text>
        {descripcionGenerada && (
          <Text style={{ color: "#a08b7d", fontStyle: "italic", marginTop: 4 }}>
            📚 Descripción generada por asistente conversacional
          </Text>
        )}
      </View>
      <TouchableOpacity style={styles.modifyBtn}>
        <Text style={styles.modifyBtnText}>Modificar reseña</Text>
      </TouchableOpacity>
      <View style={styles.sectionBox}>
        <Text style={styles.sectionLabel}>Reseña:</Text>
        {/* Espacio vacío por ahora */}
        <View style={styles.reviewPlaceholder} />
      </View>
      <TouchableOpacity style={styles.otherReviewsBtn}>
        <Text style={styles.otherReviewsBtnText}>
          Ver reseñas de otros usuarios
        </Text>
      </TouchableOpacity>

      {/* Modal de confirmación para eliminar */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar eliminación</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que quieres eliminar{" "}
              {libro?.title || "este libro"} de tu historial de lectura?
            </Text>
            <Text style={styles.modalWarning}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeleteLectura}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonDeleteText}>
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginHorizontal: 18,
  },
  headerBtn: {
    backgroundColor: "#7c4a2d",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerBtnDanger: {
    backgroundColor: "#3B2412",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
    marginHorizontal: 18,
  },
  cover: {
    width: 120,
    height: 170,
    borderRadius: 10,
    marginRight: 18,
    backgroundColor: "#FFF4E4",
  },
  infoCol: {
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 6,
  },
  meta: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
  bold: {
    fontWeight: "bold",
  },
  dateRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  dateBtn: {
    backgroundColor: "#FFF4E4",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  dateBtnText: {
    color: "#3B2412",
    fontWeight: "bold",
    fontSize: 13,
  },
  sectionBox: {
    backgroundColor: "#FFF4E4",
    borderRadius: 16,
    marginHorizontal: 18,
    marginTop: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionLabel: {
    fontWeight: "bold",
    color: "#3B2412",
    fontSize: 15,
    marginBottom: 4,
  },
  description: {
    color: "#3B2412",
    fontSize: 15,
  },
  modifyBtn: {
    backgroundColor: "#3B2412",
    borderRadius: 10,
    marginHorizontal: 18,
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  modifyBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  reviewPlaceholder: {
    minHeight: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 6,
  },
  otherReviewsBtn: {
    backgroundColor: "#332018",
    borderRadius: 16,
    marginHorizontal: 18,
    marginTop: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  otherReviewsBtnText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 17,
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
});
