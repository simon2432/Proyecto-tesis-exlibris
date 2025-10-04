import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants/ApiConfig";

interface FiltrosMarketplaceProps {
  visible: boolean;
  onClose: () => void;
  onAplicarFiltros: (filtros: FiltrosState) => void;
  filtrosActuales: FiltrosState;
}

export interface FiltrosState {
  tipoBusqueda: "titulo" | "autor";
  estadosLibro: string[];
  ubicacion: string;
}

const ESTADOS_LIBRO = [
  "Nuevo",
  "Como nuevo",
  "Muy buen estado",
  "Aceptable",
  "Dañado",
];

export default function FiltrosMarketplace({
  visible,
  onClose,
  onAplicarFiltros,
  filtrosActuales,
}: FiltrosMarketplaceProps) {
  const [filtros, setFiltros] = useState<FiltrosState>(filtrosActuales);
  const [ubicacionesDisponibles, setUbicacionesDisponibles] = useState<
    string[]
  >([]);
  const [ubicacionFiltrada, setUbicacionFiltrada] = useState<string[]>([]);
  const [cargandoUbicaciones, setCargandoUbicaciones] = useState(false);

  // Cargar ubicaciones disponibles
  useEffect(() => {
    if (visible) {
      cargarUbicaciones();
    }
  }, [visible]);

  // Filtrar ubicaciones según el texto ingresado
  useEffect(() => {
    if (filtros.ubicacion.trim()) {
      const filtradas = ubicacionesDisponibles.filter((ubicacion) =>
        ubicacion.toLowerCase().includes(filtros.ubicacion.toLowerCase())
      );
      setUbicacionFiltrada(filtradas);
    } else {
      setUbicacionFiltrada(ubicacionesDisponibles);
    }
  }, [filtros.ubicacion, ubicacionesDisponibles]);

  const cargarUbicaciones = async () => {
    setCargandoUbicaciones(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/publicaciones/ubicaciones`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUbicacionesDisponibles(response.data);
      setUbicacionFiltrada(response.data);
    } catch (error) {
      console.error("Error al cargar ubicaciones:", error);
    } finally {
      setCargandoUbicaciones(false);
    }
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      tipoBusqueda: "titulo" as const,
      estadosLibro: [],
      ubicacion: "",
    };
    setFiltros(filtrosLimpios);
    onAplicarFiltros(filtrosLimpios);
    onClose();
  };

  const toggleEstado = (estado: string) => {
    const estadosActuales = filtros.estadosLibro;
    if (estadosActuales.includes(estado)) {
      // Remover el estado si ya está seleccionado
      setFiltros({
        ...filtros,
        estadosLibro: estadosActuales.filter((e) => e !== estado),
      });
    } else {
      // Agregar el estado si no está seleccionado
      setFiltros({
        ...filtros,
        estadosLibro: [...estadosActuales, estado],
      });
    }
  };

  const aplicarFiltros = () => {
    onAplicarFiltros(filtros);
    onClose();
  };

  const seleccionarUbicacion = (ubicacion: string) => {
    setFiltros({ ...filtros, ubicacion });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.botonCerrar}>
            <Ionicons name="close" size={24} color="#7c4a2d" />
          </TouchableOpacity>
          <Text style={styles.titulo}>Filtros de Búsqueda</Text>
          <TouchableOpacity
            onPress={limpiarFiltros}
            style={styles.botonLimpiar}
          >
            <Text style={styles.textoLimpiar}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.contenido}
          showsVerticalScrollIndicator={false}
        >
          {/* Tipo de Búsqueda */}
          <View style={styles.seccion}>
            <Text style={styles.tituloSeccion}>Buscar por:</Text>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setFiltros({ ...filtros, tipoBusqueda: "titulo" })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    filtros.tipoBusqueda === "titulo" && styles.checkboxActivo,
                  ]}
                >
                  {filtros.tipoBusqueda === "titulo" && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Título del libro</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setFiltros({ ...filtros, tipoBusqueda: "autor" })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    filtros.tipoBusqueda === "autor" && styles.checkboxActivo,
                  ]}
                >
                  {filtros.tipoBusqueda === "autor" && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Autor</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Estado del Libro */}
          <View style={styles.seccion}>
            <Text style={styles.tituloSeccion}>Estados del Libro</Text>
            <View style={styles.estadosGrid}>
              {ESTADOS_LIBRO.map((estado) => (
                <TouchableOpacity
                  key={estado}
                  style={styles.estadoCheckboxRow}
                  onPress={() => toggleEstado(estado)}
                >
                  <View
                    style={[
                      styles.estadoCheckbox,
                      filtros.estadosLibro.includes(estado) &&
                        styles.estadoCheckboxActivo,
                    ]}
                  >
                    {filtros.estadosLibro.includes(estado) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.estadoCheckboxLabel}>{estado}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Ubicación */}
          <View style={styles.seccion}>
            <Text style={styles.tituloSeccion}>Ubicación</Text>
            <View style={styles.ubicacionContainer}>
              <TextInput
                style={styles.ubicacionInput}
                placeholder="Buscar ciudad..."
                placeholderTextColor="#999"
                value={filtros.ubicacion}
                onChangeText={(texto) =>
                  setFiltros({ ...filtros, ubicacion: texto })
                }
              />

              {cargandoUbicaciones ? (
                <View style={styles.cargandoContainer}>
                  <Text style={styles.textoCargando}>
                    Cargando ubicaciones...
                  </Text>
                </View>
              ) : (
                filtros.ubicacion &&
                ubicacionFiltrada.length > 0 && (
                  <View style={styles.listaUbicaciones}>
                    {ubicacionFiltrada.slice(0, 8).map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.itemUbicacion}
                        onPress={() => seleccionarUbicacion(item)}
                      >
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#7c4a2d"
                        />
                        <Text style={styles.textoItemUbicacion}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.botonAplicar}
            onPress={aplicarFiltros}
          >
            <Text style={styles.textoBotonAplicar}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: "#fff4e4",
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
  },
  botonCerrar: {
    padding: 8,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
  },
  botonLimpiar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  textoLimpiar: {
    color: "#d32f2f",
    fontSize: 16,
    fontWeight: "500",
  },
  contenido: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  seccion: {
    marginBottom: 32,
  },
  tituloSeccion: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 16,
  },
  checkboxContainer: {
    gap: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#e0d3c2",
    backgroundColor: "#fff",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActivo: {
    backgroundColor: "#3B2412",
    borderColor: "#3B2412",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#4b2e1e",
    fontWeight: "500",
  },
  estadosGrid: {
    gap: 16,
  },
  estadoCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  estadoCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#e0d3c2",
    backgroundColor: "#fff",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  estadoCheckboxActivo: {
    backgroundColor: "#3B2412",
    borderColor: "#3B2412",
  },
  estadoCheckboxLabel: {
    fontSize: 16,
    color: "#4b2e1e",
    fontWeight: "500",
  },
  ubicacionContainer: {
    position: "relative",
  },
  ubicacionInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#4b2e1e",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 52,
  },
  cargandoContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  textoCargando: {
    color: "#666",
    fontSize: 14,
  },
  listaUbicaciones: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 8,
    maxHeight: 200,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  textoItemUbicacion: {
    color: "#4b2e1e",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  botonAplicar: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  textoBotonAplicar: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
