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
  Animated,
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

  // Estados para validación
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  // Animación para mensajes
  const messageOpacity = useState(new Animated.Value(0))[0];

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
  const validateTitulo = (value: string): string => {
    if (!value.trim()) return "El título es obligatorio";
    if (value.trim().length < 2)
      return "El título debe tener al menos 2 caracteres";
    if (value.trim().length > 100)
      return "El título no puede exceder 100 caracteres";
    return "";
  };

  const validateAutor = (value: string): string => {
    if (!value.trim()) return "El autor es obligatorio";
    if (value.trim().length < 2)
      return "El autor debe tener al menos 2 caracteres";
    if (value.trim().length > 80)
      return "El autor no puede exceder 80 caracteres";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,-]+$/.test(value.trim()))
      return "El autor solo puede contener letras, espacios, puntos, comas y guiones";
    return "";
  };

  const validateGenero = (value: string): string => {
    if (!value.trim()) return "El género es obligatorio";
    if (value.trim().length < 2)
      return "El género debe tener al menos 2 caracteres";
    if (value.trim().length > 50)
      return "El género no puede exceder 50 caracteres";
    return "";
  };

  const validateEditorial = (value: string): string => {
    if (!value.trim()) return "La editorial es obligatoria";
    if (value.trim().length < 2)
      return "La editorial debe tener al menos 2 caracteres";
    if (value.trim().length > 80)
      return "La editorial no puede exceder 80 caracteres";
    return "";
  };

  const validatePaginas = (value: string): string => {
    if (!value.trim()) return "La cantidad de páginas es obligatoria";
    const paginasNum = parseInt(value.trim());
    if (isNaN(paginasNum))
      return "La cantidad de páginas debe ser un número válido";
    if (paginasNum <= 0) return "La cantidad de páginas debe ser mayor a 0";
    if (paginasNum > 10000)
      return "La cantidad de páginas no puede exceder 10,000";
    return "";
  };

  const validatePrecio = (value: string): string => {
    if (!value.trim()) return "El precio es obligatorio";
    const precioNum = parseInt(value.trim());
    if (isNaN(precioNum)) return "El precio debe ser un número válido";
    if (precioNum <= 0) return "El precio debe ser mayor a 0";
    if (precioNum > 1000000) return "El precio máximo permitido es $1.000.000";
    return "";
  };

  const validateImagen = (): string => {
    if (!imagen) return "La imagen es obligatoria";
    return "";
  };

  // Validación en tiempo real
  const validateField = (field: string, value: string) => {
    let error = "";

    switch (field) {
      case "titulo":
        error = validateTitulo(value);
        break;
      case "autor":
        error = validateAutor(value);
        break;
      case "genero":
        error = validateGenero(value);
        break;
      case "editorial":
        error = validateEditorial(value);
        break;
      case "paginas":
        error = validatePaginas(value);
        break;
      case "precio":
        error = validatePrecio(value);
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

    newErrors.titulo = validateTitulo(titulo);
    newErrors.autor = validateAutor(autor);
    newErrors.genero = validateGenero(genero);
    newErrors.editorial = validateEditorial(editorial);
    newErrors.paginas = validatePaginas(paginas);
    newErrors.precio = validatePrecio(precio);
    newErrors.imagen = validateImagen();

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

  // Handler para mostrar siempre el símbolo $ en el input
  const handlePrecioChange = (text: string) => {
    // Eliminar todo lo que no sea número
    const soloNumeros = text.replace(/[^0-9]/g, "");

    // Validar precio máximo de 1.000.000
    if (parseInt(soloNumeros) > 1000000) {
      showTemporaryMessage("El precio máximo permitido es $1.000.000", "error");
      return;
    }

    setPrecio(soloNumeros);
    validateField("precio", soloNumeros);
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
    // Validar formulario completo
    if (!validateForm()) {
      return;
    }

    try {
      const paginasNum = parseInt(paginas);
      const precioNum = parseInt(precio);

      const formData = new FormData();
      formData.append("titulo", titulo.trim());
      formData.append("autor", autor.trim());
      formData.append("genero", genero.trim());
      formData.append("editorial", editorial.trim());
      formData.append("paginas", paginasNum.toString());
      formData.append("idioma", idioma);
      formData.append("estadoLibro", estado);
      formData.append("precio", precioNum.toString());

      console.log("Datos a enviar:", {
        titulo: titulo.trim(),
        autor: autor.trim(),
        genero: genero.trim(),
        editorial: editorial.trim(),
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
        showTemporaryMessage("¡Publicación creada exitosamente!", "success");

        // Redirigir después de mostrar el mensaje de éxito
        setTimeout(() => {
          router.replace("/mis-publicaciones");
        }, 1500);
      } else {
        const errorData = await res.json();
        console.error("Error del servidor:", errorData);
        const errorMessage =
          errorData.error || "No se pudo crear la publicación";
        showTemporaryMessage(errorMessage, "error");
      }
    } catch (err) {
      console.error("Error al crear publicación:", err);
      showTemporaryMessage("No se pudo crear la publicación", "error");
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
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[
                styles.imagePicker,
                errors.imagen ? styles.imagePickerError : null,
              ]}
              onPress={pickImage}
            >
              {imagen ? (
                <Image source={{ uri: imagen }} style={styles.image} />
              ) : (
                <Text style={styles.imagePickerText}>Seleccionar imagen</Text>
              )}
            </TouchableOpacity>
            {errors.imagen && (
              <Text style={styles.errorText}>{errors.imagen}</Text>
            )}
          </View>

          {/* Título */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.titulo ? styles.inputError : null]}
              placeholder="Título"
              value={titulo}
              onChangeText={(text) => {
                setTitulo(text);
                validateField("titulo", text);
              }}
              onBlur={() => validateField("titulo", titulo)}
            />
            {errors.titulo && (
              <Text style={styles.errorText}>{errors.titulo}</Text>
            )}
          </View>

          {/* Autor */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.autor ? styles.inputError : null]}
              placeholder="Autor"
              value={autor}
              onChangeText={(text) => {
                setAutor(text);
                validateField("autor", text);
              }}
              onBlur={() => validateField("autor", autor)}
            />
            {errors.autor && (
              <Text style={styles.errorText}>{errors.autor}</Text>
            )}
          </View>

          {/* Género */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.genero ? styles.inputError : null]}
              placeholder="Género"
              value={genero}
              onChangeText={(text) => {
                setGenero(text);
                validateField("genero", text);
              }}
              onBlur={() => validateField("genero", genero)}
            />
            {errors.genero && (
              <Text style={styles.errorText}>{errors.genero}</Text>
            )}
          </View>

          {/* Editorial */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errors.editorial ? styles.inputError : null,
              ]}
              placeholder="Editorial"
              value={editorial}
              onChangeText={(text) => {
                setEditorial(text);
                validateField("editorial", text);
              }}
              onBlur={() => validateField("editorial", editorial)}
            />
            {errors.editorial && (
              <Text style={styles.errorText}>{errors.editorial}</Text>
            )}
          </View>

          {/* Cantidad de páginas */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.paginas ? styles.inputError : null]}
              placeholder="Cantidad de páginas"
              value={paginas}
              onChangeText={(text) => {
                setPaginas(text);
                validateField("paginas", text);
              }}
              onBlur={() => validateField("paginas", paginas)}
              keyboardType="numeric"
            />
            {errors.paginas && (
              <Text style={styles.errorText}>{errors.paginas}</Text>
            )}
          </View>

          {/* Precio */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.precio ? styles.inputError : null]}
              placeholder="Precio"
              value={
                precio ? `$${parseInt(precio).toLocaleString("es-ES")}` : ""
              }
              onChangeText={handlePrecioChange}
              keyboardType="numeric"
            />
            {errors.precio && (
              <Text style={styles.errorText}>{errors.precio}</Text>
            )}
          </View>
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
  imagePickerError: {
    borderColor: "#f44336",
    borderWidth: 2,
    backgroundColor: "#ffebee",
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
