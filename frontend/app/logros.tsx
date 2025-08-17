import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../constants/ApiConfig";
import CustomTabBar from "../components/CustomTabBar";

export default function LogrosScreen() {
  const router = useRouter();
  const [logros, setLogros] = useState<string[]>([]);
  const [librosLeidos, setLibrosLeidos] = useState(0);
  const [loadingLogros, setLoadingLogros] = useState(true);

  // Función para obtener logros del usuario
  const fetchLogros = async () => {
    try {
      setLoadingLogros(true);
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/usuarios/logros`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 5000,
      });

      setLogros(res.data.logros || []);
      setLibrosLeidos(res.data.librosLeidos || 0);
    } catch (error) {
      console.error("Error al cargar logros:", error);
      setLogros([]);
      setLibrosLeidos(0);
    } finally {
      setLoadingLogros(false);
    }
  };

  useEffect(() => {
    fetchLogros();
  }, []);

  // Refrescar logros cuando se regrese a la página
  useFocusEffect(
    React.useCallback(() => {
      fetchLogros();
    }, [])
  );

  if (loadingLogros) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏆 Logros</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B2412" />
          <Text style={styles.loadingText}>Cargando logros...</Text>
        </View>
        <CustomTabBar
          activeTab="perfil"
          onTabPress={(tab) => {
            if (tab === "home") router.replace("/home");
            else if (tab === "market") router.replace("/market");
            else if (tab === "perfil") router.replace("/perfil");
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Logros</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Estadísticas del usuario */}
        <View style={styles.statsSection}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{librosLeidos}</Text>
            <Text style={styles.statsLabel}>Libros leídos</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{logros.length}</Text>
            <Text style={styles.statsLabel}>Logros desbloqueados</Text>
          </View>
        </View>

        {/* Título de la sección de logros */}
        <Text style={styles.sectionTitle}>Progreso de logros</Text>

        {/* Grid de logros */}
        <View style={styles.logrosGrid}>
          {[
            {
              id: "Leidos1",
              nombre: "Primer Libro",
              descripcion: "Completa tu primera lectura",
              requerido: 1,
              imagen: require("../assets/images/svg/Leidos1.svg"),
              color: "#FF6B6B",
            },
            {
              id: "Leidos5",
              nombre: "Lector Novato",
              descripcion: "Completa 5 lecturas",
              requerido: 5,
              imagen: require("../assets/images/svg/Leidos5.svg"),
              color: "#4ECDC4",
            },
            {
              id: "Leidos10",
              nombre: "Lector Intermedio",
              descripcion: "Completa 10 lecturas",
              requerido: 10,
              imagen: require("../assets/images/svg/Leidos10.svg"),
              color: "#45B7D1",
            },
            {
              id: "Leidos20",
              nombre: "Lector Avanzado",
              descripcion: "Completa 20 lecturas",
              requerido: 20,
              imagen: require("../assets/images/svg/Leidos20.svg"),
              color: "#96CEB4",
            },
            {
              id: "Leidos25",
              nombre: "Lector Experto",
              descripcion: "Completa 25 lecturas",
              requerido: 25,
              imagen: require("../assets/images/svg/Leidos25.svg"),
              color: "#FFEAA7",
            },
          ].map((logro) => {
            const desbloqueado = logros.includes(logro.id);
            const progreso = Math.min(librosLeidos / logro.requerido, 1);
            const porcentaje = Math.round(progreso * 100);

            return (
              <View
                key={logro.id}
                style={[
                  styles.logroItem,
                  desbloqueado && styles.logroItemDesbloqueado,
                ]}
              >
                {/* Imagen del logro */}
                <View
                  style={[
                    styles.logroImagen,
                    !desbloqueado && styles.logroImagenBloqueado,
                    { backgroundColor: logro.color },
                  ]}
                >
                  <Image
                    source={logro.imagen}
                    style={styles.logroImagenInner}
                  />
                  {!desbloqueado && (
                    <View style={styles.logroBloqueado}>
                      <Text style={styles.logroBloqueadoText}>🔒</Text>
                    </View>
                  )}
                  {desbloqueado && (
                    <View style={styles.logroDesbloqueado}>
                      <Text style={styles.logroDesbloqueadoText}>✓</Text>
                    </View>
                  )}
                </View>

                {/* Información del logro */}
                <View style={styles.logroInfo}>
                  <Text
                    style={[
                      styles.logroNombre,
                      !desbloqueado && styles.logroNombreBloqueado,
                    ]}
                  >
                    {logro.nombre}
                  </Text>
                  <Text
                    style={[
                      styles.logroDescripcion,
                      !desbloqueado && styles.logroDescripcionBloqueado,
                    ]}
                  >
                    {logro.descripcion}
                  </Text>

                  {/* Progreso */}
                  <View style={styles.progressContainer}>
                    <Text
                      style={[
                        styles.progressText,
                        !desbloqueado && styles.progressTextBloqueado,
                      ]}
                    >
                      {Math.min(librosLeidos, logro.requerido)}/
                      {logro.requerido} libros ({porcentaje}%)
                    </Text>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progreso * 100}%`,
                            backgroundColor: desbloqueado ? "#4CAF50" : "#ddd",
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Mensaje motivacional */}
        <View style={styles.motivacionSection}>
          <Text style={styles.motivacionTitle}>¡Sigue leyendo!</Text>
          <Text style={styles.motivacionText}>
            Cada libro que completes te acerca más a nuevos logros. ¡Descubre
            historias increíbles y construye tu biblioteca personal!
          </Text>
        </View>
      </ScrollView>

      <CustomTabBar
        activeTab="perfil"
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
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
  },
  placeholder: {
    width: 80,
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

  // Sección de estadísticas
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 30,
  },
  statsCard: {
    backgroundColor: "#fff4e4",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    minWidth: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: "#7c4a2d",
    textAlign: "center",
    fontWeight: "500",
  },

  // Título de sección
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 18,
  },

  // Grid de logros
  logrosGrid: {
    paddingHorizontal: 18,
    gap: 20,
  },
  logroItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logroItemDesbloqueado: {
    backgroundColor: "#f0f8f0",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },

  // Imagen del logro
  logroImagen: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 20,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logroImagenBloqueado: {
    opacity: 0.5,
  },
  logroImagenInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  logroBloqueado: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#e74c3c",
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  logroBloqueadoText: {
    fontSize: 14,
    color: "#fff",
  },
  logroDesbloqueado: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  logroDesbloqueadoText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },

  // Información del logro
  logroInfo: {
    flex: 1,
  },
  logroNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 6,
  },
  logroNombreBloqueado: {
    color: "#999",
  },
  logroDescripcion: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 18,
  },
  logroDescripcionBloqueado: {
    color: "#ccc",
  },

  // Barra de progreso
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  progressTextBloqueado: {
    color: "#ccc",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Sección de motivación
  motivacionSection: {
    backgroundColor: "#fff4e4",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 18,
    marginTop: 30,
    marginBottom: 20,
    alignItems: "center",
  },
  motivacionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 12,
    textAlign: "center",
  },
  motivacionText: {
    fontSize: 16,
    color: "#7c4a2d",
    textAlign: "center",
    lineHeight: 24,
  },
});
