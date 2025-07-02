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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import { API_BASE_URL } from "../constants/ApiConfig";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setUser } = useUser();

  const handleLogin = async () => {
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
    }
  };

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
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#a08b7d"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar sesión</Text>
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
});
