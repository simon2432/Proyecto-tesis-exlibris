import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../contexts/UserContext";
import { API_BASE_URL } from "../constants/ApiConfig";

const ubicaciones = ["Buenos Aires", "Córdoba", "Mendoza"]; // Opciones de ejemplo

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [ubicacion, setUbicacion] = useState(ubicaciones[0]);
  const router = useRouter();
  const { setUser } = useUser();

  const handleRegister = async () => {
    if (password !== repeatPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        nombre: nombre.trim(),
        email,
        password,
        ubicacion,
        documento: dni,
      });

      // Guardar token y datos del usuario
      await AsyncStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.error || "Falló el registro");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre y apellido"
        value={nombre}
        onChangeText={setNombre}
        placeholderTextColor="#a08b7d"
      />
      <TextInput
        style={styles.input}
        placeholder="DNI"
        value={dni}
        onChangeText={setDni}
        keyboardType="numeric"
        placeholderTextColor="#a08b7d"
      />
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
      <TextInput
        style={styles.input}
        placeholder="Repetir contraseña"
        value={repeatPassword}
        onChangeText={setRepeatPassword}
        secureTextEntry
        placeholderTextColor="#a08b7d"
      />
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
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrarse</Text>
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
