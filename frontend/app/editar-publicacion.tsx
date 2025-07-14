import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "../constants/ApiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

const ESTADOS = [
  "Nuevo",
  "Como nuevo",
  "Usado en buen estado",
  "Usado con detalles",
  "Para repuesto o reciclaje",
];

const IDIOMAS = [
  "Español",
  "Inglés",
  "Francés",
  "Alemán",
  "Italiano",
  "Portugués",
  "Ruso",
  "Chino",
  "Japonés",
  "Coreano",
  "Árabe",
  "Holandés",
  "Sueco",
  "Danés",
  "Finlandés",
  "Noruego",
  "Polaco",
  "Turco",
  "Griego",
  "Hebreo",
];

export default function EditarPublicacion() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [publicacion, setPublicacion] = useState<any>(null);
  const [imagen, setImagen] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    autor: "",
    genero: "",
    editorial: "",
    paginas: "",
    idioma: "",
    estado: "",
    precio: "",
  });

  useEffect(() => {
    if (id) fetchPublicacion();
  }, [id]);

  const fetchPublicacion = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/publicaciones/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error("No se pudo cargar la publicación");
      const data = await res.json();
      setPublicacion(data);
      setImagen(data.imagenUrl ? `${API_BASE_URL}${data.imagenUrl}` : null);
      setForm({
        titulo: data.titulo || "",
        autor: data.autor || "",
        genero: data.genero || "",
        editorial: data.editorial || "",
        paginas: data.paginas ? String(data.paginas) : "",
        idioma: data.idioma || "",
        estado: data.estado || "",
        precio: data.precio ? String(data.precio) : "",
      });
    } catch (e: any) {
      setError(e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImagen(result.assets[0].uri);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (
        imagen &&
        imagen !==
          (publicacion?.imagenUrl
            ? `${API_BASE_URL}${publicacion.imagenUrl}`
            : null)
      ) {
        // Solo si la imagen cambió
        const filename = imagen.split("/").pop() || "portada.jpg";
        const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        // @ts-ignore
        formData.append("imagen", { uri: imagen, name: filename, type });
      }
      const res = await fetch(`${API_BASE_URL}/publicaciones/${id}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          Accept: "application/json",
          // No poner Content-Type para que RN lo setee automáticamente
        },
        body: formData,
      });
      if (!res.ok) throw new Error("No se pudo guardar la publicación");
      router.replace("/mis-publicaciones");
    } catch (e: any) {
      setError(e.message || "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7c4a2d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.volverBtn}
          onPress={() => router.replace("/mis-publicaciones")}
        >
          <Text style={styles.volverBtnText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar publicación</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.form}>
          {/* Imagen */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imagen ? (
              <Image source={{ uri: imagen }} style={styles.image} />
            ) : (
              <Text style={styles.imagePickerText}>Seleccionar imagen</Text>
            )}
          </TouchableOpacity>
          {/* Título */}
          <TextInput
            style={styles.input}
            placeholder="Título"
            value={form.titulo}
            onChangeText={(v) => handleChange("titulo", v)}
          />
          {/* Autor */}
          <TextInput
            style={styles.input}
            placeholder="Autor"
            value={form.autor}
            onChangeText={(v) => handleChange("autor", v)}
          />
          {/* Género */}
          <TextInput
            style={styles.input}
            placeholder="Género"
            value={form.genero}
            onChangeText={(v) => handleChange("genero", v)}
          />
          {/* Editorial */}
          <TextInput
            style={styles.input}
            placeholder="Editorial"
            value={form.editorial}
            onChangeText={(v) => handleChange("editorial", v)}
          />
          {/* Cantidad de páginas */}
          <TextInput
            style={styles.input}
            placeholder="Cantidad de páginas"
            value={form.paginas}
            onChangeText={(v) =>
              handleChange("paginas", v.replace(/[^0-9]/g, ""))
            }
            keyboardType="numeric"
          />
          {/* Precio */}
          <TextInput
            style={styles.input}
            placeholder="Precio"
            value={form.precio ? `$${form.precio}` : ""}
            onChangeText={(v) =>
              handleChange("precio", v.replace(/[^0-9]/g, ""))
            }
            keyboardType="numeric"
          />
          {/* Idioma */}
          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>Idioma</Text>
            <View style={styles.pickerWrapper}>
              {Platform.OS === "web" ? (
                <select
                  style={styles.select as any}
                  value={form.idioma}
                  onChange={(e) => handleChange("idioma", e.target.value)}
                >
                  {IDIOMAS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              ) : (
                <Picker
                  selectedValue={form.idioma}
                  onValueChange={(v) => handleChange("idioma", v)}
                  style={styles.picker}
                  dropdownIconColor="#3B2412"
                >
                  {IDIOMAS.map((idioma) => (
                    <Picker.Item key={idioma} label={idioma} value={idioma} />
                  ))}
                </Picker>
              )}
            </View>
          </View>
          {/* Estado */}
          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>Estado</Text>
            <View style={styles.pickerWrapper}>
              {Platform.OS === "web" ? (
                <select
                  style={styles.select as any}
                  value={form.estado}
                  onChange={(e) => handleChange("estado", e.target.value)}
                >
                  {ESTADOS.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              ) : (
                <Picker
                  selectedValue={form.estado}
                  onValueChange={(v) => handleChange("estado", v)}
                  style={styles.picker}
                  dropdownIconColor="#3B2412"
                >
                  {ESTADOS.map((estado) => (
                    <Picker.Item key={estado} label={estado} value={estado} />
                  ))}
                </Picker>
              )}
            </View>
          </View>
          {/* Botón guardar */}
          <TouchableOpacity
            style={styles.crearBtn}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.crearBtnText}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Text>
          </TouchableOpacity>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>
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
    paddingTop: 32,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
  },
  volverBtn: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginRight: 12,
  },
  volverBtnText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  form: {
    marginTop: 24,
    paddingHorizontal: 18,
    gap: 16,
  },
  imagePicker: {
    width: 120,
    height: 160,
    backgroundColor: "#f3e8da",
    borderRadius: 14,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
  },
  imagePickerText: {
    color: "#7c4a2d",
    fontWeight: "bold",
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  input: {
    backgroundColor: "#fff4e4",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#3B2412",
    borderWidth: 1,
    borderColor: "#e0d3c2",
  },
  selectContainer: {
    marginTop: 8,
  },
  selectLabel: {
    color: "#3B2412",
    fontWeight: "bold",
    marginBottom: 4,
  },
  pickerWrapper: {
    backgroundColor: "#fff4e4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0d3c2",
    overflow: "hidden",
  },
  select: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    color: "#3B2412",
    backgroundColor: "#fff4e4",
  },
  picker: {
    color: "#3B2412",
    width: "100%",
    backgroundColor: "#fff4e4",
  },
  crearBtn: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },
  crearBtnText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 17,
  },
  error: {
    color: "#d32f2f",
    marginTop: 10,
    textAlign: "center",
  },
});
