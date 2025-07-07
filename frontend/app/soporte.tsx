import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function SoporteScreen() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImagenes([...imagenes, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleEnviar = () => {
    setModalVisible(true);
    setTitulo("");
    setMensaje("");
    setImagenes([]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Soporte y Ayuda</Text>
        <Text style={styles.infoText}>
          ¿Tienes algún problema, sugerencia o consulta? Completa el siguiente
          formulario o escríbenos a soporte@exlibris.com. Nuestro equipo te
          responderá lo antes posible.
        </Text>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Breve resumen del problema o consulta"
          value={titulo}
          onChangeText={setTitulo}
          maxLength={60}
        />
        <Text style={styles.label}>Mensaje</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          placeholder="Describe tu problema, sugerencia o consulta con detalle."
          value={mensaje}
          onChangeText={setMensaje}
          multiline
          maxLength={800}
        />
        <Text style={styles.label}>Adjuntar fotos (opcional)</Text>
        <View style={styles.imagesRow}>
          {imagenes.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.imageThumb} />
          ))}
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
            <Text style={styles.addImageText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleEnviar}>
          <Text style={styles.buttonText}>Enviar mensaje</Text>
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
            <Text style={styles.modalTitle}>¡Mensaje enviado con éxito!</Text>
            <Text style={styles.modalMsg}>
              Gracias por contactarnos. Pronto recibirás una respuesta de
              nuestro equipo.
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
    marginBottom: 16,
    textAlign: "center",
  },
  infoText: {
    fontSize: 15,
    color: "#3B2412",
    marginBottom: 18,
    textAlign: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#7c4a2d",
    marginTop: 16,
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
  },
  imagesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  imageThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0d3c2",
  },
  addImageBtn: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: "#e0d3c2",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageText: {
    fontSize: 28,
    color: "#7c4a2d",
    fontWeight: "bold",
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
});
