import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  Button,
  ActivityIndicator,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import { API_BASE_URL } from "../constants/ApiConfig";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Estados para mensajes temporales
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

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

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      await AsyncStorage.setItem("token", res.data.token);
      // Guardar los datos del usuario en el contexto
      setUser(res.data.user);

      showTemporaryMessage("¡Login exitoso! Redirigiendo...", "success");

      // Redirigir después de mostrar el mensaje de éxito
      setTimeout(() => {
        router.replace("/home");
      }, 1500);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error || "Credenciales incorrectas";
      showTemporaryMessage(errorMessage, "error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showTemporaryMessage("Por favor ingresa tu email", "error");
      return;
    }

    setLoading(true);
    try {
      console.log("Sending forgot password request for email:", email.trim());

      const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: email.trim(),
      });

      console.log("Forgot password response:", res.data);
      console.log("Reset token received:", res.data.resetToken);

      setResetToken(res.data.resetToken);
      setShowForgotPassword(false);
      setShowResetPassword(true);

      console.log("State updated - showResetPassword:", true);
      console.log("resetToken in state:", res.data.resetToken);

      showTemporaryMessage(
        "Verifica tu email para continuar con la recuperación",
        "success"
      );
    } catch (error: any) {
      console.error("Forgot password error:", error);
      console.error("Error response:", error?.response?.data);

      const errorMessage =
        error?.response?.data?.error || "Error al procesar la solicitud";
      showTemporaryMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    console.log("handleResetPassword called");
    console.log("resetToken:", resetToken);
    console.log("newPassword:", newPassword);
    console.log("confirmPassword:", confirmPassword);

    if (!newPassword || !confirmPassword) {
      showTemporaryMessage("Por favor completa todos los campos", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showTemporaryMessage("Las contraseñas no coinciden", "error");
      return;
    }

    if (newPassword.length < 6) {
      showTemporaryMessage(
        "La contraseña debe tener al menos 6 caracteres",
        "error"
      );
      return;
    }

    if (!resetToken) {
      showTemporaryMessage("Token de recuperación no válido", "error");
      return;
    }

    setLoading(true);
    console.log("Sending reset password request...");

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        resetToken,
        newPassword,
        confirmPassword,
      });

      console.log("Reset password response:", response.data);

      // Mostrar mensaje de éxito
      setShowSuccessMessage(true);

      // Después de 3 segundos, volver al login
      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowResetPassword(false);
        setNewPassword("");
        setConfirmPassword("");
        setResetToken("");
      }, 3000);
    } catch (error: any) {
      console.error("Reset password error:", error);
      console.error("Error response:", error?.response?.data);

      const errorMessage =
        error?.response?.data?.error || "Error al actualizar la contraseña";
      showTemporaryMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Renderizar pantalla de reset de contraseña
  if (showResetPassword) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Nueva contraseña</Text>

        {/* Mensaje de éxito */}
        {showSuccessMessage && (
          <View style={styles.successMessage}>
            <Text style={styles.successText}>
              ✅ Contraseña actualizada correctamente
            </Text>
            <Text style={styles.successSubtext}>
              Volviendo al login en unos segundos...
            </Text>
          </View>
        )}

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Nueva contraseña"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            placeholderTextColor="#a08b7d"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Text style={styles.eyeIcon}>{showNewPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor="#a08b7d"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.eyeIcon}>
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.buttonText, styles.loadingText]}>
                Actualizando...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Actualizar contraseña</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.smallButton]}
          onPress={() => {
            setShowResetPassword(false);
            setNewPassword("");
            setConfirmPassword("");
            setResetToken("");
          }}
        >
          <Text style={[styles.buttonText, styles.smallButtonText]}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Renderizar pantalla de forgot password
  if (showForgotPassword) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa tu email para recibir instrucciones de recuperación
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#a08b7d"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[styles.buttonText, styles.loadingText]}>
                Enviando...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Enviar instrucciones</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.smallButton]}
          onPress={() => setShowForgotPassword(false)}
        >
          <Text style={[styles.buttonText, styles.smallButtonText]}>
            Volver al login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Renderizar pantalla de login principal
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

      {/* Espacio para logo/título si se desea */}
      <Text style={styles.title}>Iniciar sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#a08b7d"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#a08b7d"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.button, loginLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loginLoading}
      >
        {loginLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={[styles.buttonText, styles.loadingText]}>
              Iniciando sesión...
            </Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        )}
      </TouchableOpacity>

      {/* Enlace para recuperar contraseña */}
      <TouchableOpacity
        style={styles.forgotPasswordLink}
        onPress={() => setShowForgotPassword(true)}
      >
        <Text style={styles.forgotPasswordText}>
          ¿Te olvidaste tu contraseña?
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
  input: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
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
  subtitle: {
    fontSize: 16,
    color: "#7c4a2d",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  forgotPasswordLink: {
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: "#7c4a2d",
    fontSize: 16,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: 8,
  },
  successText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  successSubtext: {
    color: "#e8f5e8",
    fontSize: 14,
    textAlign: "center",
  },
  passwordContainer: {
    width: "100%",
    maxWidth: 350,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0d3c2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#4b2e1e",
  },
  eyeButton: {
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeIcon: {
    fontSize: 20,
  },
});
