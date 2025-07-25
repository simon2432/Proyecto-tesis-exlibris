import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/ApiConfig";

const IDIOMAS = [
  "Español",
  "Inglés",
  "Chino",
  "Hindi",
  "Árabe",
  "Francés",
  "Ruso",
  "Portugués",
  "Bengalí",
  "Alemán",
  "Japonés",
  "Coreano",
  "Italiano",
  "Turco",
  "Vietnamita",
  "Polaco",
  "Holandés",
  "Tailandés",
  "Sueco",
  "Griego",
];
const ESTADOS = [
  "Nuevo",
  "Como nuevo",
  "Muy buen estado",
  "Aceptable",
  "Dañado",
];

export default function CrearPublicacion() {
  const router = useRouter();
  const [imagen, setImagen] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [genero, setGenero] = useState("");
  const [editorial, setEditorial] = useState("");
  const [paginas, setPaginas] = useState("");
  const [idioma, setIdioma] = useState(IDIOMAS[0]);
  const [estado, setEstado] = useState(ESTADOS[0]);
  const [precio, setPrecio] = useState("");
  const [showIdiomaPicker, setShowIdiomaPicker] = useState(false);
  const [showEstadoPicker, setShowEstadoPicker] = useState(false);

  // Handler para mostrar siempre el símbolo $ en el input
  const handlePrecioChange = (text: string) => {
    // Eliminar todo lo que no sea número
    const soloNumeros = text.replace(/[^0-9]/g, "");

    // Validar precio máximo de 1.000.000
    if (parseInt(soloNumeros) > 1000000) {
      Alert.alert("Precio máximo", "El precio máximo permitido es $1.000.000");
      return;
    }

    setPrecio(soloNumeros);
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Se requieren permisos para acceder a tus fotos.");
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });
    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      setImagen(pickerResult.assets[0].uri);
    }
  };

  const handleCrear = async () => {
    try {
      if (
        !titulo ||
        !autor ||
        !genero ||
        !editorial ||
        !paginas ||
        !idioma ||
        !estado ||
        !precio
      ) {
        Alert.alert("Completa todos los campos obligatorios");
        return;
      }

      // Validar que páginas sea un número válido
      const paginasNum = parseInt(paginas);
      if (isNaN(paginasNum) || paginasNum <= 0) {
        Alert.alert(
          "Error",
          "El número de páginas debe ser un número válido mayor a 0"
        );
        return;
      }

      // Validar que precio sea un número válido
      const precioNum = parseInt(precio);
      if (isNaN(precioNum) || precioNum <= 0) {
        Alert.alert("Error", "El precio debe ser un número válido mayor a 0");
        return;
      }
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("autor", autor);
      formData.append("genero", genero);
      formData.append("editorial", editorial);
      formData.append("paginas", paginasNum.toString());
      formData.append("idioma", idioma);
      formData.append("estadoLibro", estado);
      formData.append("precio", precioNum.toString());

      console.log("Datos a enviar:", {
        titulo,
        autor,
        genero,
        editorial,
        paginas: paginasNum,
        idioma,
        estadoLibro: estado,
        precio: precioNum,
      });
      if (imagen) {
        if (Platform.OS === "web") {
          // En web, fetch la imagen como blob
          const response = await fetch(imagen);
          const blob = await response.blob();
          const fileName = `publicacion_${Date.now()}.jpg`;
          formData.append("imagen", blob, fileName);
        } else {
          formData.append("imagen", {
            uri: imagen,
            name: `publicacion_${Date.now()}.jpg`,
            type: "image/jpeg",
          } as any);
        }
      }
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/publicaciones`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: formData,
      });
      if (res.ok) {
        Alert.alert("Publicación creada", "¡Tu publicación ha sido creada!");
        router.replace("/mis-publicaciones");
      } else {
        const errorData = await res.json();
        console.error("Error del servidor:", errorData);
        Alert.alert(
          "Error",
          errorData.error || "No se pudo crear la publicación"
        );
      }
    } catch (err) {
      console.error("Error al crear publicación:", err);
      Alert.alert("Error", "No se pudo crear la publicación");
    }
  };

  const CustomPicker = ({
    visible,
    onClose,
    options,
    selectedValue,
    onSelect,
    title,
  }: {
    visible: boolean;
    onClose: () => void;
    options: string[];
    selectedValue: string;
    onSelect: (value: string) => void;
    title: string;
  }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.optionsList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionItem,
                  selectedValue === option && styles.selectedOption,
                ]}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedValue === option && styles.selectedOptionText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Crear publicación</Text>
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
            value={titulo}
            onChangeText={setTitulo}
          />
          {/* Autor */}
          <TextInput
            style={styles.input}
            placeholder="Autor"
            value={autor}
            onChangeText={setAutor}
          />
          {/* Género */}
          <TextInput
            style={styles.input}
            placeholder="Género"
            value={genero}
            onChangeText={setGenero}
          />
          {/* Editorial */}
          <TextInput
            style={styles.input}
            placeholder="Editorial"
            value={editorial}
            onChangeText={setEditorial}
          />
          {/* Cantidad de páginas */}
          <TextInput
            style={styles.input}
            placeholder="Cantidad de páginas"
            value={paginas}
            onChangeText={setPaginas}
            keyboardType="numeric"
          />
          {/* Precio */}
          <TextInput
            style={styles.input}
            placeholder="Precio"
            value={precio ? `$${parseInt(precio).toLocaleString("es-ES")}` : ""}
            onChangeText={handlePrecioChange}
            keyboardType="numeric"
          />
          {/* Idioma */}
          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>Idioma</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowIdiomaPicker(true)}
            >
              <Text style={styles.pickerButtonText}>{idioma}</Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          {/* Estado */}
          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>Estado</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowEstadoPicker(true)}
            >
              <Text style={styles.pickerButtonText}>{estado}</Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          {/* Botón crear */}
          <TouchableOpacity style={styles.crearBtn} onPress={handleCrear}>
            <Text style={styles.crearBtnText}>Crear publicación</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pickers modales */}
      <CustomPicker
        visible={showIdiomaPicker}
        onClose={() => setShowIdiomaPicker(false)}
        options={IDIOMAS}
        selectedValue={idioma}
        onSelect={setIdioma}
        title="Seleccionar idioma"
      />
      <CustomPicker
        visible={showEstadoPicker}
        onClose={() => setShowEstadoPicker(false)}
        options={ESTADOS}
        selectedValue={estado}
        onSelect={setEstado}
        title="Seleccionar estado"
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
  pickerButton: {
    backgroundColor: "#fff4e4",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0d3c2",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#3B2412",
  },
  pickerArrow: {
    fontSize: 12,
    color: "#3B2412",
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
  // Estilos para el modal del picker
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B2412",
  },
  closeButton: {
    fontSize: 16,
    color: "#3B2412",
    fontWeight: "bold",
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedOption: {
    backgroundColor: "#fff4e4",
  },
  optionText: {
    fontSize: 16,
    color: "#3B2412",
  },
  selectedOptionText: {
    fontWeight: "bold",
  },
});
