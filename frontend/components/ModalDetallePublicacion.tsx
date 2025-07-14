import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { API_BASE_URL } from "../constants/ApiConfig";

export default function ModalDetallePublicacion({
  visible,
  publicacion,
  onClose,
  onEdit,
}: {
  visible: boolean;
  publicacion: any;
  onClose: () => void;
  onEdit: () => void;
}) {
  if (!publicacion) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header con logo y botones */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
              <Text style={styles.headerBtnText}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={onEdit}>
              <Text style={styles.headerBtnText}>Editar</Text>
            </TouchableOpacity>
          </View>
          {/* Portada y precio */}
          <View style={styles.centered}>
            {publicacion.imagenUrl ? (
              <Image
                source={{ uri: `${API_BASE_URL}${publicacion.imagenUrl}` }}
                style={styles.cover}
              />
            ) : (
              <View style={styles.cover} />
            )}
          </View>
          <Text style={styles.priceText}>${publicacion.precio}</Text>
          <Text style={styles.title}>{publicacion.titulo}</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              Autor: <Text style={styles.bold}>{publicacion.autor || "-"}</Text>
            </Text>
            <Text style={styles.infoItem}>
              Género:{" "}
              <Text style={styles.bold}>{publicacion.genero || "-"}</Text>
            </Text>
            <Text style={styles.infoItem}>
              Editorial:{" "}
              <Text style={styles.bold}>{publicacion.editorial || "-"}</Text>
            </Text>
            <Text style={styles.infoItem}>
              Cantidad de páginas:{" "}
              <Text style={styles.bold}>{publicacion.paginas || "-"}</Text>
            </Text>
            <Text style={styles.infoItem}>
              Idioma:{" "}
              <Text style={styles.bold}>{publicacion.idioma || "-"}</Text>
            </Text>
            <Text style={styles.infoItem}>
              Estado:{" "}
              <Text style={styles.bold}>{publicacion.estado || "-"}</Text>
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 0,
    width: Platform.OS === "web" ? 400 : "90%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff4e4",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerBtn: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  headerBtnText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 15,
  },
  centered: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  cover: {
    width: 180,
    height: 260,
    borderRadius: 16,
    backgroundColor: "#FFF4E4",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  priceTagShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: "center",
  },
  priceTag: {
    backgroundColor: "#fff4e4",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 7,
    alignItems: "center",
    marginTop: -18,
    marginBottom: 8,
  },
  priceText: {
    color: "#3B2412",
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  infoList: {
    width: "90%",
    marginBottom: 18,
    alignItems: "center",
  },
  infoItem: {
    fontSize: 16,
    color: "#3B2412",
    marginBottom: 4,
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
  },
});
