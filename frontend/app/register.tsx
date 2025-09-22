import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../contexts/UserContext";
import { API_BASE_URL } from "../constants/ApiConfig";

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

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [ubicacion, setUbicacion] = useState(ubicaciones[0]);

  // Estados para validación
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [isValidating, setIsValidating] = useState(false);

  // Animación para mensajes
  const messageOpacity = useState(new Animated.Value(0))[0];

  const router = useRouter();
  const { setUser } = useUser();

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

  const validateDNI = (value: string): string => {
    if (!value.trim()) return "El DNI es obligatorio";
    if (!/^\d{7,8}$/.test(value.trim()))
      return "El DNI debe tener 7 u 8 dígitos";
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

  const validateRepeatPassword = (value: string): string => {
    if (!value) return "Debe repetir la contraseña";
    if (value !== password) return "Las contraseñas no coinciden";
    return "";
  };

  // Validación en tiempo real
  const validateField = (field: string, value: string) => {
    let error = "";

    switch (field) {
      case "nombre":
        error = validateNombre(value);
        break;
      case "dni":
        error = validateDNI(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "telefono":
        error = validateTelefono(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "repeatPassword":
        error = validateRepeatPassword(value);
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
    newErrors.dni = validateDNI(dni);
    newErrors.email = validateEmail(email);
    newErrors.telefono = validateTelefono(telefono);
    newErrors.password = validatePassword(password);
    newErrors.repeatPassword = validateRepeatPassword(repeatPassword);

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

  const handleRegister = async () => {
    // Validar formulario completo
    if (!validateForm()) {
      return;
    }

    setIsValidating(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        password,
        ubicacion,
        documento: dni.trim(),
      });

      // Guardar token y datos del usuario
      await AsyncStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      showTemporaryMessage("¡Registro exitoso! Redirigiendo...", "success");

      // Redirigir después de mostrar el mensaje de éxito
      setTimeout(() => {
        router.replace("/home");
      }, 1500);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || "Falló el registro";
      showTemporaryMessage(errorMessage, "error");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

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

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.nombre ? styles.inputError : null]}
          placeholder="Nombre y apellido"
          value={nombre}
          onChangeText={(text) => {
            setNombre(text);
            validateField("nombre", text);
          }}
          onBlur={() => validateField("nombre", nombre)}
          placeholderTextColor="#a08b7d"
        />
        {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.dni ? styles.inputError : null]}
          placeholder="DNI"
          value={dni}
          onChangeText={(text) => {
            setDni(text);
            validateField("dni", text);
          }}
          onBlur={() => validateField("dni", dni)}
          keyboardType="numeric"
          placeholderTextColor="#a08b7d"
        />
        {errors.dni && <Text style={styles.errorText}>{errors.dni}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            validateField("email", text);
          }}
          onBlur={() => validateField("email", email)}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#a08b7d"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.telefono ? styles.inputError : null]}
          placeholder="Teléfono"
          value={telefono}
          onChangeText={(text) => {
            setTelefono(text);
            validateField("telefono", text);
          }}
          onBlur={() => validateField("telefono", telefono)}
          keyboardType="phone-pad"
          placeholderTextColor="#a08b7d"
        />
        {errors.telefono && (
          <Text style={styles.errorText}>{errors.telefono}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.password ? styles.inputError : null]}
          placeholder="Contraseña"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            validateField("password", text);
            // Revalidar repeatPassword si ya tiene valor
            if (repeatPassword) {
              validateField("repeatPassword", repeatPassword);
            }
          }}
          onBlur={() => validateField("password", password)}
          secureTextEntry
          placeholderTextColor="#a08b7d"
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            errors.repeatPassword ? styles.inputError : null,
          ]}
          placeholder="Repetir contraseña"
          value={repeatPassword}
          onChangeText={(text) => {
            setRepeatPassword(text);
            validateField("repeatPassword", text);
          }}
          onBlur={() => validateField("repeatPassword", repeatPassword)}
          secureTextEntry
          placeholderTextColor="#a08b7d"
        />
        {errors.repeatPassword && (
          <Text style={styles.errorText}>{errors.repeatPassword}</Text>
        )}
      </View>
      <View style={styles.selectContainer}>
        <Text style={styles.selectLabel}>Ubicación:</Text>
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
      </View>
      <TouchableOpacity
        style={[styles.button, isValidating ? styles.buttonDisabled : null]}
        onPress={handleRegister}
        disabled={isValidating}
      >
        <Text style={styles.buttonText}>
          {isValidating ? "Registrando..." : "Registrarse"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.smallButton]}
        onPress={() => router.replace("/")}
      >
        <Text style={[styles.buttonText, styles.smallButtonText]}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF4E4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4b2e1e",
    marginBottom: 30,
    letterSpacing: 1,
    textAlign: "center",
    fontFamily: Platform.OS === "android" ? "serif" : undefined,
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
    width: "100%",
    maxWidth: 350,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#4b2e1e",
    borderWidth: 1,
    borderColor: "#e0d3c2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
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
  selectContainer: {
    width: "100%",
    maxWidth: 350,
    marginBottom: 24,
  },
  selectLabel: {
    color: "#7c4a2d",
    fontWeight: "600",
    marginBottom: 6,
    fontSize: 15,
  },
  pickerWrapper: {
    backgroundColor: "#e0d3c2",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    color: "#4b2e1e",
  },
  button: {
    backgroundColor: "#332018",
    paddingVertical: 16,
    borderRadius: 10,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#9e9e9e",
    opacity: 0.7,
  },
  buttonText: {
    color: "#f3e8da",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  smallButton: {
    backgroundColor: "#7c4a2d",
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    width: "50%",
    alignSelf: "center",
  },
  smallButtonText: {
    fontSize: 16,
  },
});
