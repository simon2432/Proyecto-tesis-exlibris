import React, { useEffect, useState, useRef } from "react";
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
  const [editandoFechas, setEditandoFechas] = useState(false);
  const [fechaInicioEdit, setFechaInicioEdit] = useState<Date | null>(null);
  const [fechaFinEdit, setFechaFinEdit] = useState<Date | null>(null);
  const [pickerEditType, setPickerEditType] = useState<"inicio" | "fin" | null>(
    null
  );
  const [errorFechas, setErrorFechas] = useState<string | null>(null);
  const [editandoSoloInicio, setEditandoSoloInicio] = useState(false);
  const [fechaInicioSoloEdit, setFechaInicioSoloEdit] = useState<Date | null>(
    null
  );
  const inicioBtnRef = useRef<any>(null);
  const finBtnRef = useRef<any>(null);
  const [pickerPosition, setPickerPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

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

  useEffect(() => {
    if (Platform.OS === "web" && pickerEditType) {
      let ref = pickerEditType === "inicio" ? inicioBtnRef : finBtnRef;
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setPickerPosition({
          top: rect.top + window.scrollY - 8,
          left: rect.left + window.scrollX,
        });
      }
    } else {
      setPickerPosition(null);
    }
  }, [pickerEditType]);

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
    <ScrollView
      style={{
        backgroundColor: "#FFF",
        paddingTop: Platform.OS === "android" ? 40 : 0,
      }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            if (Platform.OS === "web") {
              router.replace("/perfil");
            } else {
              router.back();
            }
          }}
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
        </View>
      </View>
      <View
        style={[
          styles.dateRow,
          Platform.OS !== "web" && {
            flexWrap: "wrap",
            alignItems: "flex-start",
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            flex: Platform.OS === "web" ? undefined : 1,
          }}
        >
          {Platform.OS === "web" ? (
            <button
              ref={inicioBtnRef}
              style={{
                ...styles.dateBtn,
                cursor: editandoFechas ? "pointer" : "not-allowed",
                background: "none",
                border: "none",
                padding: 0,
                marginRight: 8,
              }}
              onClick={() => {
                if (editandoFechas) setPickerEditType("inicio");
              }}
              disabled={!editandoFechas}
            >
              <span style={{ ...styles.dateBtnText }}>
                {"Fecha de inicio: " +
                  (editandoFechas
                    ? fechaInicioEdit
                      ? new Date(fechaInicioEdit).toLocaleDateString()
                      : "-"
                    : lectura.fechaInicio
                    ? new Date(lectura.fechaInicio).toLocaleDateString()
                    : "-")}
              </span>
            </button>
          ) : (
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => {
                if (editandoFechas) setPickerEditType("inicio");
              }}
              disabled={!editandoFechas}
            >
              <Text style={styles.dateBtnText}>
                Fecha de inicio:{" "}
                {editandoFechas
                  ? fechaInicioEdit
                    ? new Date(fechaInicioEdit).toLocaleDateString()
                    : "-"
                  : lectura.fechaInicio
                  ? new Date(lectura.fechaInicio).toLocaleDateString()
                  : "-"}
              </Text>
            </TouchableOpacity>
          )}
          {Platform.OS === "web" ? (
            <button
              ref={finBtnRef}
              style={{
                ...styles.dateBtn,
                cursor: editandoFechas ? "pointer" : "not-allowed",
                background: "none",
                border: "none",
                padding: 0,
              }}
              onClick={() => {
                if (editandoFechas) setPickerEditType("fin");
              }}
              disabled={!editandoFechas}
            >
              <span style={{ ...styles.dateBtnText }}>
                {"Fecha de fin: " +
                  (editandoFechas
                    ? fechaFinEdit
                      ? new Date(fechaFinEdit).toLocaleDateString()
                      : "-"
                    : lectura.fechaFin
                    ? new Date(lectura.fechaFin).toLocaleDateString()
                    : "-")}
              </span>
            </button>
          ) : (
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => {
                if (editandoFechas) setPickerEditType("fin");
              }}
              disabled={!editandoFechas}
            >
              <Text style={styles.dateBtnText}>
                Fecha de fin:{" "}
                {editandoFechas
                  ? fechaFinEdit
                    ? new Date(fechaFinEdit).toLocaleDateString()
                    : "-"
                  : lectura.fechaFin
                  ? new Date(lectura.fechaFin).toLocaleDateString()
                  : "-"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Botones de acción: en web a la derecha, en mobile abajo */}
        {Platform.OS === "web" ? (
          <View style={{ flexDirection: "row", marginLeft: 8 }}>
            {!lectura.fechaFin && !editandoSoloInicio && !editandoFechas && (
              <TouchableOpacity
                style={[styles.dateBtn, { backgroundColor: "#3B2412" }]}
                onPress={() => {
                  setEditandoSoloInicio(true);
                  setFechaInicioSoloEdit(
                    lectura.fechaInicio ? new Date(lectura.fechaInicio) : null
                  );
                  setErrorFechas(null);
                  setPickerEditType("inicio");
                }}
              >
                <Text style={[styles.dateBtnText, { color: "#fff4e4" }]}>
                  Modificar fecha de inicio
                </Text>
              </TouchableOpacity>
            )}
            {!lectura.fechaFin && editandoSoloInicio && (
              <TouchableOpacity
                style={[styles.dateBtn, { backgroundColor: "#388e3c" }]}
                onPress={async () => {
                  if (!fechaInicioSoloEdit) return;
                  const hoy = new Date();
                  if (fechaInicioSoloEdit > hoy) {
                    setErrorFechas(
                      "La fecha de inicio no puede ser mayor a hoy."
                    );
                    return;
                  }
                  const token = await AsyncStorage.getItem("token");
                  await axios.put(
                    `${API_BASE_URL}/lecturas/${id}`,
                    { fechaInicio: fechaInicioSoloEdit },
                    {
                      headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                    }
                  );
                  setLectura((prev: any) => ({
                    ...prev,
                    fechaInicio: fechaInicioSoloEdit
                      ? fechaInicioSoloEdit.toISOString()
                      : prev.fechaInicio,
                  }));
                  setEditandoSoloInicio(false);
                  setErrorFechas(null);
                }}
              >
                <Text style={[styles.dateBtnText, { color: "#fff4e4" }]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            )}
            {!lectura.fechaFin && !editandoFechas && !editandoSoloInicio && (
              <TouchableOpacity
                style={[styles.dateBtn, { backgroundColor: "#3B2412" }]}
                onPress={async () => {
                  const today = new Date();
                  const token = await AsyncStorage.getItem("token");
                  await axios.put(
                    `${API_BASE_URL}/lecturas/${id}`,
                    { fechaFin: today },
                    {
                      headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                    }
                  );
                  setLectura((prev: any) => ({
                    ...prev,
                    fechaFin: today.toISOString(),
                  }));
                }}
              >
                <Text style={[styles.dateBtnText, { color: "#fff4e4" }]}>
                  Finalizar lectura
                </Text>
              </TouchableOpacity>
            )}
            {lectura.fechaFin && (
              <TouchableOpacity
                style={[
                  styles.dateBtn,
                  { backgroundColor: editandoFechas ? "#388e3c" : "#3B2412" },
                ]}
                onPress={async () => {
                  if (!editandoFechas) {
                    setEditandoFechas(true);
                    setFechaInicioEdit(
                      lectura.fechaInicio ? new Date(lectura.fechaInicio) : null
                    );
                    setFechaFinEdit(
                      lectura.fechaFin ? new Date(lectura.fechaFin) : null
                    );
                    setErrorFechas(null);
                  } else {
                    if (
                      fechaInicioEdit &&
                      fechaFinEdit &&
                      fechaInicioEdit > fechaFinEdit
                    ) {
                      setErrorFechas(
                        "La fecha de inicio debe ser anterior o igual a la de finalización."
                      );
                      return;
                    }
                    const token = await AsyncStorage.getItem("token");
                    await axios.put(
                      `${API_BASE_URL}/lecturas/${id}`,
                      { fechaInicio: fechaInicioEdit, fechaFin: fechaFinEdit },
                      {
                        headers: token
                          ? { Authorization: `Bearer ${token}` }
                          : {},
                      }
                    );
                    setLectura((prev: any) => ({
                      ...prev,
                      fechaInicio: fechaInicioEdit
                        ? fechaInicioEdit.toISOString()
                        : prev.fechaInicio,
                      fechaFin: fechaFinEdit
                        ? fechaFinEdit.toISOString()
                        : prev.fechaFin,
                    }));
                    setEditandoFechas(false);
                    setErrorFechas(null);
                  }
                }}
              >
                <Text style={[styles.dateBtnText, { color: "#fff4e4" }]}>
                  {editandoFechas ? "Guardar" : "Modificar"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            {!lectura.fechaFin && !editandoSoloInicio && !editandoFechas && (
              <TouchableOpacity
                style={[
                  styles.dateBtn,
                  { backgroundColor: "#3B2412", marginTop: 8 },
                ]}
                onPress={() => {
                  setEditandoSoloInicio(true);
                  setFechaInicioSoloEdit(
                    lectura.fechaInicio ? new Date(lectura.fechaInicio) : null
                  );
                  setErrorFechas(null);
                  setPickerEditType("inicio");
                }}
              >
                <Text style={[styles.dateBtnText, { color: "#fff4e4" }]}>
                  Modificar fecha de inicio
                </Text>
              </TouchableOpacity>
            )}
            {!lectura.fechaFin && editandoSoloInicio && (
              <TouchableOpacity
                style={[
                  styles.dateBtn,
                  { backgroundColor: "#388e3c", marginTop: 8 },
                ]}
                onPress={async () => {
                  if (!fechaInicioSoloEdit) return;
                  const hoy = new Date();
                  if (fechaInicioSoloEdit > hoy) {
                    setErrorFechas(
                      "La fecha de inicio no puede ser mayor a hoy."
                    );
                    return;
                  }
                  const token = await AsyncStorage.getItem("token");
                  await axios.put(
                    `${API_BASE_URL}/lecturas/${id}`,
                    { fechaInicio: fechaInicioSoloEdit },
                    {
                      headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                    }
                  );
                  setLectura((prev: any) => ({
                    ...prev,
                    fechaInicio: fechaInicioSoloEdit
                      ? fechaInicioSoloEdit.toISOString()
                      : prev.fechaInicio,
                  }));
                  setEditandoSoloInicio(false);
                  setErrorFechas(null);
                }}
              >
                <Text style={[styles.dateBtnText, { color: "#fff4e4" }]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            )}
            {!lectura.fechaFin && !editandoFechas && !editandoSoloInicio && (
              <TouchableOpacity
                style={[
                  styles.dateBtn,
                  { backgroundColor: "#3B2412", marginTop: 8 },
                ]}
                onPress={async () => {
                  const today = new Date();
                  const token = await AsyncStorage.getItem("token");
                  await axios.put(
                    `${API_BASE_URL}/lecturas/${id}`,
                    { fechaFin: today },
                    {
                      headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                    }
                  );
                  setLectura((prev: any) => ({
                    ...prev,
                    fechaFin: today.toISOString(),
                  }));
                }}
              >
                <Text style={[styles.dateBtnText, { color: "#fff4e4" }]}>
                  Finalizar lectura
                </Text>
              </TouchableOpacity>
            )}
            {lectura.fechaFin && (
              <TouchableOpacity
                style={[
                  styles.dateBtn,
                  {
                    backgroundColor: editandoFechas ? "#388e3c" : "#3B2412",
                    marginTop: 8,
                  },
                ]}
                onPress={async () => {
                  if (!editandoFechas) {
                    setEditandoFechas(true);
                    setFechaInicioEdit(
                      lectura.fechaInicio ? new Date(lectura.fechaInicio) : null
                    );
                    setFechaFinEdit(
                      lectura.fechaFin ? new Date(lectura.fechaFin) : null
                    );
                    setErrorFechas(null);
                  } else {
                    if (
                      fechaInicioEdit &&
                      fechaFinEdit &&
                      fechaInicioEdit > fechaFinEdit
                    ) {
                      setErrorFechas(
                        "La fecha de inicio debe ser anterior o igual a la de finalización."
                      );
                      return;
                    }
                    const token = await AsyncStorage.getItem("token");
                    await axios.put(
                      `${API_BASE_URL}/lecturas/${id}`,
                      { fechaInicio: fechaInicioEdit, fechaFin: fechaFinEdit },
                      {
                        headers: token
                          ? { Authorization: `Bearer ${token}` }
                          : {},
                      }
                    );
                    setLectura((prev: any) => ({
                      ...prev,
                      fechaInicio: fechaInicioEdit
                        ? fechaInicioEdit.toISOString()
                        : prev.fechaInicio,
                      fechaFin: fechaFinEdit
                        ? fechaFinEdit.toISOString()
                        : prev.fechaFin,
                    }));
                    setEditandoFechas(false);
                    setErrorFechas(null);
                  }
                }}
              >
                <Text style={[styles.dateBtnText, { color: "#fff4e4" }]}>
                  {editandoFechas ? "Guardar" : "Modificar"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      {errorFechas && (
        <Text
          style={{
            color: "red",
            marginLeft: 18,
            marginTop: 4,
            fontWeight: "bold",
          }}
        >
          {errorFechas}
        </Text>
      )}
      {pickerEditType &&
        (Platform.OS === "web" ? (
          <input
            type="date"
            autoFocus
            max={new Date().toISOString().slice(0, 10)}
            style={{
              position: "fixed",
              top: pickerPosition ? pickerPosition.top : "50%",
              left: pickerPosition ? pickerPosition.left : "50%",
              transform: pickerPosition ? "none" : "translate(-50%, -50%)",
              zIndex: 9999,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 8,
              fontSize: 18,
              padding: 8,
            }}
            value={
              pickerEditType === "inicio"
                ? editandoSoloInicio
                  ? fechaInicioSoloEdit
                    ? new Date(fechaInicioSoloEdit).toISOString().slice(0, 10)
                    : ""
                  : fechaInicioEdit
                  ? new Date(fechaInicioEdit).toISOString().slice(0, 10)
                  : ""
                : fechaFinEdit
                ? new Date(fechaFinEdit).toISOString().slice(0, 10)
                : ""
            }
            onChange={(e) => {
              const [year, month, day] = e.target.value.split("-");
              const date = new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
              );
              if (pickerEditType === "inicio") {
                if (editandoSoloInicio) setFechaInicioSoloEdit(date);
                else setFechaInicioEdit(date);
              }
              if (pickerEditType === "fin") setFechaFinEdit(date);
            }}
            onBlur={() => setPickerEditType(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape")
                setPickerEditType(null);
            }}
          />
        ) : (
          <DateTimePicker
            value={
              pickerEditType === "inicio"
                ? editandoSoloInicio
                  ? fechaInicioSoloEdit instanceof Date
                    ? fechaInicioSoloEdit
                    : fechaInicioSoloEdit
                    ? new Date(fechaInicioSoloEdit)
                    : new Date()
                  : fechaInicioEdit instanceof Date
                  ? fechaInicioEdit
                  : fechaInicioEdit
                  ? new Date(fechaInicioEdit)
                  : new Date()
                : fechaFinEdit instanceof Date
                ? fechaFinEdit
                : fechaFinEdit
                ? new Date(fechaFinEdit)
                : new Date()
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={(event, date) => {
              if (date) {
                if (pickerEditType === "inicio") {
                  if (editandoSoloInicio) setFechaInicioSoloEdit(date);
                  else setFechaInicioEdit(date);
                }
                if (pickerEditType === "fin") setFechaFinEdit(date);
              }
              setPickerEditType(null);
            }}
          />
        ))}
      {showInicio && !editandoFechas && (
        <DateTimePicker
          value={
            lectura.fechaInicio ? new Date(lectura.fechaInicio) : new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChangeInicio}
        />
      )}
      {showFin && !editandoFechas && (
        <DateTimePicker
          value={lectura.fechaFin ? new Date(lectura.fechaFin) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChangeFin}
        />
      )}
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
    marginLeft: 18,
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
