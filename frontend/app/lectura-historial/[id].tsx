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
  TextInput,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "../../constants/ApiConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getBestQualityImage,
  getPlaceholderImage,
  getOptimizedImageConfig,
} from "../../utils/imageUtils";

// Precargar imagen placeholder
const preloadPlaceholder = () => {
  ExpoImage.prefetch(getPlaceholderImage());
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
  const [editandoResena, setEditandoResena] = useState(false);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewError, setReviewError] = useState<string>("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewCharCount, setReviewCharCount] = useState(0);
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);

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

  useEffect(() => {
    setReviewRating(lectura?.reviewRating ?? null);
    setReviewComment(lectura?.reviewComment ?? "");
    setReviewCharCount(lectura?.reviewComment?.length || 0);
    setEditandoResena(false);
  }, [lectura]);

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

  const handleGuardarResena = async () => {
    setReviewError("");
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError("Selecciona una valoración de 1 a 5 estrellas.");
      return;
    }
    if (!reviewComment || reviewComment.length > 300) {
      setReviewError(
        "El comentario es obligatorio y debe tener máximo 300 caracteres."
      );
      return;
    }
    setReviewLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/lecturas/${id}/review`,
        { reviewRating, reviewComment },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setLectura(res.data);
      setEditandoResena(false);
    } catch (err: any) {
      setReviewError(err?.response?.data?.error || "Error al guardar reseña");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleEliminarResena = async () => {
    setReviewLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.delete(`${API_BASE_URL}/lecturas/${id}/review`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setLectura(res.data);
      setEditandoResena(false);
    } catch (err: any) {
      setReviewError(err?.response?.data?.error || "Error al eliminar reseña");
    } finally {
      setReviewLoading(false);
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
            uri: getBestQualityImage(libro?.imageLinks),
          }}
          style={styles.cover}
          placeholder={getPlaceholderImage()}
          {...getOptimizedImageConfig()}
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
      <View style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>Reseña:</Text>
        {/* Si no finalizó el libro */}
        {!lectura.fechaFin && (
          <View style={styles.reviewBox}>
            <Text style={{ color: "#888" }}>
              Debes finalizar el libro para hacer una reseña
            </Text>
          </View>
        )}
        {/* Si puede reseñar */}
        {lectura.fechaFin && !lectura.reviewRating && !editandoResena && (
          <View style={styles.reviewBox}>
            <Text style={{ color: "#888", marginBottom: 8 }}>
              ¡Cuéntanos qué te pareció este libro!
            </Text>
            {/* Estrellas */}
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      color:
                        reviewRating && reviewRating >= star
                          ? "#FFD700"
                          : "#CCC",
                    }}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Textarea */}
            <TextInput
              style={{
                minHeight: 60,
                padding: 8,
                backgroundColor: "#FFF",
                borderRadius: 8,
              }}
              multiline
              maxLength={300}
              onChangeText={(text) => {
                setReviewComment(text);
                setReviewCharCount(text.length);
              }}
              value={reviewComment}
              placeholder="Escribe tu reseña..."
            />
            <Text
              style={{ alignSelf: "flex-end", color: "#888", fontSize: 12 }}
            >
              {reviewCharCount}/300
            </Text>
            {reviewError ? (
              <Text style={{ color: "red", marginTop: 4 }}>{reviewError}</Text>
            ) : null}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!reviewRating ||
                  !reviewComment ||
                  reviewComment.length > 300) && { opacity: 0.5 },
              ]}
              onPress={handleGuardarResena}
              disabled={
                !reviewRating ||
                !reviewComment ||
                reviewComment.length > 300 ||
                reviewLoading
              }
            >
              <Text style={styles.saveBtnText}>
                {reviewLoading ? "Guardando..." : "Guardar reseña"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Si ya hay reseña y no está editando */}
        {lectura.fechaFin && lectura.reviewRating && !editandoResena && (
          <View style={styles.reviewBox}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <Text
                  key={star}
                  style={{
                    fontSize: 22,
                    color: lectura.reviewRating >= star ? "#FFD700" : "#CCC",
                  }}
                >
                  ★
                </Text>
              ))}
            </View>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              {lectura.reviewComment}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setEditandoResena(true);
                  setReviewRating(lectura.reviewRating);
                  setReviewComment(lectura.reviewComment);
                }}
              >
                <Text style={styles.editBtnText}>Modificar reseña</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setShowDeleteReviewModal(true)}
              >
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
            {reviewError ? (
              <Text style={{ color: "red", marginTop: 4 }}>{reviewError}</Text>
            ) : null}
          </View>
        )}
        {/* Si está editando reseña */}
        {lectura.fechaFin && editandoResena && (
          <View style={styles.reviewBox}>
            <Text style={{ color: "#888", marginBottom: 8 }}>
              Edita tu reseña
            </Text>
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      color:
                        reviewRating && reviewRating >= star
                          ? "#FFD700"
                          : "#CCC",
                    }}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={{
                minHeight: 60,
                padding: 8,
                backgroundColor: "#FFF",
                borderRadius: 8,
              }}
              multiline
              maxLength={300}
              onChangeText={(text) => {
                setReviewComment(text);
                setReviewCharCount(text.length);
              }}
              value={reviewComment}
              placeholder="Escribe tu reseña..."
            />
            <Text
              style={{ alignSelf: "flex-end", color: "#888", fontSize: 12 }}
            >
              {reviewCharCount}/300
            </Text>
            {reviewError ? (
              <Text style={{ color: "red", marginTop: 4 }}>{reviewError}</Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleGuardarResena}
                disabled={reviewLoading}
              >
                <Text style={styles.saveBtnText}>
                  {reviewLoading ? "Guardando..." : "Guardar cambios"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditandoResena(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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

      {/* Modal de confirmación para eliminar reseña */}
      <Modal
        visible={showDeleteReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteReviewModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDeleteReviewModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Eliminar reseña</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que quieres eliminar tu reseña de este libro?
            </Text>
            <Text style={styles.modalWarning}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteReviewModal(false)}
                disabled={reviewLoading}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={async () => {
                  setShowDeleteReviewModal(false);
                  await handleEliminarResena();
                }}
                disabled={reviewLoading}
              >
                <Text style={styles.modalButtonDeleteText}>
                  {reviewLoading ? "Eliminando..." : "Eliminar"}
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
    width: 140,
    height: 200,
    borderRadius: 12,
    marginRight: 18,
    backgroundColor: "#FFF4E4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 8,
    marginLeft: 18,
  },
  reviewBox: {
    padding: 16,
    backgroundColor: "#FFF4E4",
    borderRadius: 8,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: "#3B2412",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  editBtn: {
    backgroundColor: "#3B2412",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  editBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  deleteBtn: {
    backgroundColor: "#d32f2f",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: "#3B2412",
    fontWeight: "bold",
    fontSize: 15,
  },
});
