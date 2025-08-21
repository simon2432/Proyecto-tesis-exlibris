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
  const router = useRouter();
  const { setUser } = useUser();

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
      router.replace("/home"); // redirige a la pantalla principal
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.error || "Falló el login");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu email");
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

      Alert.alert(
        "Éxito",
        "Verifica tu email para continuar con la recuperación"
      );
    } catch (error: any) {
      console.error("Forgot password error:", error);
      console.error("Error response:", error?.response?.data);

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Error al procesar la solicitud"
      );
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
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!resetToken) {
      Alert.alert("Error", "Token de recuperación no válido");
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

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Error al actualizar la contraseña"
      );
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
  successMessage: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
