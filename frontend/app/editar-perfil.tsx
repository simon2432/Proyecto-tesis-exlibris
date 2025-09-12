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
  const [ubicacion, setUbicacion] = useState(user?.ubicacion || "");
  const [fotoPerfil, setFotoPerfil] = useState(user?.fotoPerfil || null);
  const [fotoPerfilFile, setFotoPerfilFile] = useState<any>(null);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Asegurar que la ubicación esté inicializada correctamente
  useEffect(() => {
    if (user?.ubicacion && ubicaciones.includes(user.ubicacion)) {
      setUbicacion(user.ubicacion);
    } else if (!ubicacion) {
      setUbicacion(ubicaciones[0]); // Fallback a la primera ciudad si no hay ubicación
    }
  }, [user?.ubicacion, ubicacion]);

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
    try {
      setLoading(true);
      let nuevaFotoUrl = fotoPerfil;
      if (fotoPerfilFile) {
        nuevaFotoUrl = await uploadPhotoIfNeeded();
      }
      const token = await AsyncStorage.getItem("token");
      const body: any = {
        nombre,
        email,
        telefono,
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
        setModalVisible(true);
        setPasswordActual("");
        setPasswordNueva("");
        setFotoPerfilFile(null);
      } else {
        Alert.alert("Error", "No se pudo actualizar el perfil.");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.error || "No se pudo actualizar el perfil."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          maxLength={40}
        />
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={60}
        />
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          maxLength={20}
        />
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
        <Text style={styles.label}>Contraseña actual</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={passwordActual}
            onChangeText={setPasswordActual}
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
        <Text style={styles.label}>Nueva contraseña</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={passwordNueva}
            onChangeText={setPasswordNueva}
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
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¡Perfil actualizado!</Text>
            <Text style={styles.modalMsg}>
              Tus cambios se han guardado correctamente.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setModalVisible(false);
                router.back();
              }}
            >
              <Text style={styles.modalBtnText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F2",
  },
  scrollContent: {
    paddingTop: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    width: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMsg: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 18,
    textAlign: "center",
  },
  modalBtn: {
    backgroundColor: "#7c4a2d",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
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
