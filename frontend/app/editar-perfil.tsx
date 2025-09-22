import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
  Image,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useUser } from "../contexts/UserContext";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/ApiConfig";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";

const ubicaciones = [
  "Buenos Aires (CABA)",
  "Bahía Blanca",
  "Bariloche (San Carlos de Bariloche)",
  "Catamarca (San Fernando del Valle de Catamarca)",
  "Chaco (Resistencia)",
  "Chubut (Rawson)",
  "Cipolletti",
  "Comodoro Rivadavia",
  "Concordia",
  "Corrientes",
  "Córdoba",
  "Formosa",
  "Gualeguaychú",
  "Jujuy (San Salvador de Jujuy)",
  "La Plata",
  "La Rioja",
  "La Pampa (Santa Rosa)",
  "Lomas de Zamora",
  "Luján de Cuyo",
  "Mar del Plata",
  "Mendoza",
  "Mercedes (Corrientes)",
  "Misiones (Posadas)",
  "Necochea",
  "Neuquén",
  "Oberá",
  "Paraná",
  "Pergamino",
  "Pilar",
  "Plottier",
  "Posadas",
  "Puerto Iguazú",
  "Puerto Madryn",
  "Quilmes",
  "Rafaela",
  "Río Cuarto",
  "Río Gallegos",
  "Río Grande",
  "Rivadavia (Mendoza)",
  "Rosario",
  "Salta",
  "San Fernando del Valle de Catamarca",
  "San Fernando (BsAs)",
  "San Francisco (Córdoba)",
  "San Isidro",
  "San Juan",
  "San Luis",
  "San Martín (BsAs)",
  "San Martín de los Andes",
  "San Miguel",
  "San Miguel de Tucumán",
  "San Nicolás de los Arroyos",
  "San Pedro",
  "San Rafael",
  "Santa Fe",
  "Santiago del Estero",
  "Tandil",
  "Tartagal",
  "Tierra del Fuego (Ushuaia)",
  "Tigre",
  "Trelew",
  "Tucumán (San Miguel de Tucumán)",
  "Ushuaia",
  "Venado Tuerto",
  "Viedma",
  "Villa Carlos Paz",
  "Villa Gesell",
  "Villa Gobernador Gálvez",
  "Villa La Angostura",
  "Villa María",
  "Villa Mercedes",
  "Zárate",
];

export default function EditarPerfilScreen() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [ubicacion, setUbicacion] = useState(user?.ubicacion || ubicaciones[0]);
  const [fotoPerfil, setFotoPerfil] = useState(user?.fotoPerfil || null);
  const [fotoPerfilFile, setFotoPerfilFile] = useState<any>(null);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para validación
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  // Animación para mensajes
  const messageOpacity = useState(new Animated.Value(0))[0];

  // Asegurar que la ubicación esté inicializada correctamente cuando cambie el usuario
  useEffect(() => {
    if (user?.ubicacion && ubicaciones.includes(user.ubicacion)) {
      setUbicacion(user.ubicacion);
    }
  }, [user?.ubicacion]);

  // Función para mostrar mensajes temporales
  const showTemporaryMessage = (
    text: string,
    type: "error" | "success" = "error"
  ) => {
    setMessageText(text);
    setMessageType(type);
    setShowMessage(true);

    // Animar entrada
    Animated.timing(messageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Ocultar después de 3 segundos
    setTimeout(() => {
      Animated.timing(messageOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowMessage(false);
      });
    }, 3000);
  };

  // Validaciones individuales
  const validateNombre = (value: string): string => {
    if (!value.trim()) return "El nombre es obligatorio";
    if (value.trim().length < 2)
      return "El nombre debe tener al menos 2 caracteres";
    if (value.trim().length > 50)
      return "El nombre no puede exceder 50 caracteres";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value.trim()))
      return "El nombre solo puede contener letras y espacios";
    return "";
  };

  const validateEmail = (value: string): string => {
    if (!value.trim()) return "El email es obligatorio";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return "Ingrese un email válido";
    return "";
  };

  const validateTelefono = (value: string): string => {
    if (!value.trim()) return "El teléfono es obligatorio";
    if (!/^\d{10,15}$/.test(value.trim()))
      return "El teléfono debe tener entre 10 y 15 dígitos";
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) return "La contraseña es obligatoria";
    if (value.length < 6)
      return "La contraseña debe tener al menos 6 caracteres";
    if (value.length > 50)
      return "La contraseña no puede exceder 50 caracteres";

    // Validar que tenga al menos una letra
    if (!/[a-zA-Z]/.test(value)) {
      return "La contraseña debe contener al menos una letra";
    }

    // Validar que tenga al menos un número
    if (!/\d/.test(value)) {
      return "La contraseña debe contener al menos un número";
    }

    return "";
  };

  const validatePasswordNueva = (value: string): string => {
    if (!value) return ""; // La nueva contraseña es opcional
    if (value.length < 6)
      return "La nueva contraseña debe tener al menos 6 caracteres";
    if (value.length > 50)
      return "La nueva contraseña no puede exceder 50 caracteres";

    // Validar que tenga al menos una letra
    if (!/[a-zA-Z]/.test(value)) {
      return "La nueva contraseña debe contener al menos una letra";
    }

    // Validar que tenga al menos un número
    if (!/\d/.test(value)) {
      return "La nueva contraseña debe contener al menos un número";
    }

    return "";
  };

  // Validación en tiempo real
  const validateField = (field: string, value: string) => {
    let error = "";

    switch (field) {
      case "nombre":
        error = validateNombre(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "telefono":
        error = validateTelefono(value);
        break;
      case "passwordActual":
        error = validatePassword(value);
        break;
      case "passwordNueva":
        error = validatePasswordNueva(value);
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));

    return error === "";
  };

  // Validación completa del formulario
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    newErrors.nombre = validateNombre(nombre);
    newErrors.email = validateEmail(email);
    newErrors.telefono = validateTelefono(telefono);

    // Solo validar contraseñas si se están cambiando
    if (passwordActual || passwordNueva) {
      if (passwordActual && !passwordNueva) {
        newErrors.passwordNueva = "Debe ingresar la nueva contraseña";
      }
      if (!passwordActual && passwordNueva) {
        newErrors.passwordActual = "Debe ingresar la contraseña actual";
      }
      if (passwordActual) {
        newErrors.passwordActual = validatePassword(passwordActual);
      }
      if (passwordNueva) {
        newErrors.passwordNueva = validatePasswordNueva(passwordNueva);
      }
    }

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (hasErrors) {
      const firstError = Object.values(newErrors).find((error) => error !== "");
      if (firstError) {
        showTemporaryMessage(firstError, "error");
      }
    }

    return !hasErrors;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      // Mostrar inmediatamente la nueva foto seleccionada
      setFotoPerfil(result.assets[0].uri);
      setFotoPerfilFile(result.assets[0]);
    }
  };

  const uploadPhotoIfNeeded = async () => {
    if (!fotoPerfilFile) return fotoPerfil;
    const formData = new FormData();
    if (Platform.OS === "web") {
      const response = await fetch(fotoPerfilFile.uri);
      const blob = await response.blob();
      const fileName = fotoPerfilFile.fileName || "profile.jpg";
      const file = new File([blob], fileName, {
        type: fotoPerfilFile.mimeType || "image/jpeg",
      });
      formData.append("foto", file);
    } else {
      formData.append("foto", {
        uri: fotoPerfilFile.uri,
        name: fotoPerfilFile.fileName || "profile.jpg",
        type: fotoPerfilFile.mimeType || "image/jpeg",
      } as any);
    }
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/usuarios/foto-perfil`, {
      method: "POST",
      headers: {
        ...(Platform.OS === "web"
          ? {}
          : { "Content-Type": "multipart/form-data" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    return data.url || fotoPerfil;
  };

  const handleGuardar = async () => {
    // Validar formulario completo
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      let nuevaFotoUrl = fotoPerfil;
      if (fotoPerfilFile) {
        nuevaFotoUrl = await uploadPhotoIfNeeded();
      }
      const token = await AsyncStorage.getItem("token");
      const body: any = {
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        ubicacion,
        fotoPerfil: nuevaFotoUrl,
      };
      if (passwordActual && passwordNueva) {
        body.passwordActual = passwordActual;
        body.passwordNueva = passwordNueva;
      }
      const res = await axios.put(`${API_BASE_URL}/usuarios/editar`, body, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && res.data.user) {
        setUser(res.data.user);
        setPasswordActual("");
        setPasswordNueva("");
        setFotoPerfilFile(null);

        showTemporaryMessage("¡Perfil actualizado correctamente!", "success");

        // Redirigir después de mostrar el mensaje de éxito
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        showTemporaryMessage("No se pudo actualizar el perfil", "error");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || "No se pudo actualizar el perfil";
      showTemporaryMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Mensaje temporal */}
      {showMessage && (
        <Animated.View
          style={[
            styles.messageContainer,
            { opacity: messageOpacity },
            messageType === "error"
              ? styles.errorMessage
              : styles.successMessage,
          ]}
        >
          <Text style={styles.messageText}>{messageText}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/logoLechuza.png")}
          style={styles.logo}
        />
      </View>

      {/* Botón Volver */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Editar perfil</Text>
        <View style={styles.avatarRow}>
          <ExpoImage
            source={
              fotoPerfilFile
                ? { uri: fotoPerfilFile.uri }
                : fotoPerfil
                ? {
                    uri: fotoPerfil.startsWith("http")
                      ? fotoPerfil
                      : `${API_BASE_URL}${fotoPerfil}?t=${Date.now()}`,
                  }
                : require("../assets/images/perfil.png")
            }
            style={styles.avatar}
            placeholder="https://placehold.co/100x100"
            contentFit="cover"
            transition={200}
          />
          <TouchableOpacity style={styles.cambiarFotoBtn} onPress={pickImage}>
            <Text style={styles.cambiarFotoText}>Cambiar foto</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, errors.nombre ? styles.inputError : null]}
            value={nombre}
            onChangeText={(text) => {
              setNombre(text);
              validateField("nombre", text);
            }}
            onBlur={() => validateField("nombre", nombre)}
            maxLength={40}
          />
          {errors.nombre && (
            <Text style={styles.errorText}>{errors.nombre}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              validateField("email", text);
            }}
            onBlur={() => validateField("email", email)}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={60}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={[styles.input, errors.telefono ? styles.inputError : null]}
            value={telefono}
            onChangeText={(text) => {
              setTelefono(text);
              validateField("telefono", text);
            }}
            onBlur={() => validateField("telefono", telefono)}
            keyboardType="phone-pad"
            maxLength={20}
          />
          {errors.telefono && (
            <Text style={styles.errorText}>{errors.telefono}</Text>
          )}
        </View>
        <Text style={styles.label}>Ubicación</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={ubicacion}
            onValueChange={setUbicacion}
            style={styles.picker}
            dropdownIconColor="#4b2e1e"
          >
            {ubicaciones.map((op) => (
              <Picker.Item label={op} value={op} key={op} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Documento</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#eee", color: "#888" }]}
          value={user?.documento ? String(user.documento) : ""}
          editable={false}
        />
        <Text style={styles.label}>Fecha de registro</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#eee", color: "#888" }]}
          value={
            user?.fechaRegistro
              ? new Date(user.fechaRegistro).toLocaleDateString()
              : ""
          }
          editable={false}
        />
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña actual</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={[
                styles.input,
                { flex: 1 },
                errors.passwordActual ? styles.inputError : null,
              ]}
              value={passwordActual}
              onChangeText={(text) => {
                setPasswordActual(text);
                validateField("passwordActual", text);
              }}
              onBlur={() => validateField("passwordActual", passwordActual)}
              placeholder="Contraseña actual"
              secureTextEntry={!showPassword}
              maxLength={40}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={{ marginLeft: 8 }}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#7c4a2d"
              />
            </TouchableOpacity>
          </View>
          {errors.passwordActual && (
            <Text style={styles.errorText}>{errors.passwordActual}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nueva contraseña</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={[
                styles.input,
                { flex: 1 },
                errors.passwordNueva ? styles.inputError : null,
              ]}
              value={passwordNueva}
              onChangeText={(text) => {
                setPasswordNueva(text);
                validateField("passwordNueva", text);
              }}
              onBlur={() => validateField("passwordNueva", passwordNueva)}
              placeholder="Nueva contraseña"
              secureTextEntry={!showPasswordNueva}
              maxLength={40}
            />
            <TouchableOpacity
              onPress={() => setShowPasswordNueva((v) => !v)}
              style={{ marginLeft: 8 }}
            >
              <Ionicons
                name={showPasswordNueva ? "eye-off" : "eye"}
                size={22}
                color="#7c4a2d"
              />
            </TouchableOpacity>
          </View>
          {errors.passwordNueva && (
            <Text style={styles.errorText}>{errors.passwordNueva}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleGuardar}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F2",
  },
  // Mensajes temporales
  messageContainer: {
    position: "absolute",
    top: Platform.OS === "android" ? 50 : 80,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  successMessage: {
    backgroundColor: "#e8f5e8",
    borderLeftWidth: 4,
    borderLeftColor: "#4caf50",
  },
  messageText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#2e2e2e",
  },
  // Contenedor de input con error
  inputContainer: {
    marginBottom: 8,
  },
  header: {
    backgroundColor: "#fff4e4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingTop: Platform.OS === "android" ? 50 : 40,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
  },
  logo: {
    width: 40,
    height: 40,
  },
  backButton: {
    backgroundColor: "#3B2412",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
    marginLeft: 18,
    alignSelf: "flex-start",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 18,
    textAlign: "center",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#e0d3c2",
    backgroundColor: "#fff",
  },
  cambiarFotoBtn: {
    backgroundColor: "#e0d3c2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  cambiarFotoText: {
    color: "#7c4a2d",
    fontWeight: "bold",
    fontSize: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#7c4a2d",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0d3c2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 2,
  },
  inputError: {
    borderColor: "#f44336",
    borderWidth: 2,
    backgroundColor: "#ffebee",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
  button: {
    marginTop: 28,
    alignSelf: "center",
    backgroundColor: "#7c4a2d",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 36,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0d3c2",
    marginBottom: 2,
  },
  picker: {
    height: 50,
    color: "#3B2412",
  },
});
