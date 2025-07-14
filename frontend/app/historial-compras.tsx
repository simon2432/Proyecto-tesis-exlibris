import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

export default function HistorialCompras() {
  const router = useRouter();

  // Ejemplo de compra
  const compras = [
    {
      id: 1,
      portada: "https://images.unsplash.com/photo-1512820790803-83ca734da794", // ejemplo
      titulo: "Historias de valdivia",
      vendedor: "Marcos Bidegain",
      fecha: "19/06/2025",
      tipoEntrega: "Envío",
      estado: "Pago pendiente",
    },
    {
      id: 2,
      portada: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4", // ejemplo
      titulo: "Ensayo de la vida real",
      vendedor: "Franco Fernandez",
      fecha: "16/05/2025",
      tipoEntrega: "Envío",
      estado: "En camino",
    },
    {
      id: 3,
      portada: "https://images.unsplash.com/photo-1523475496153-3d6cc8760bc7", // ejemplo
      titulo: "La aventura de lo real",
      vendedor: "Paula Rodríguez",
      fecha: "12/02/2025",
      tipoEntrega: "Envío",
      estado: "Completado",
    },
  ];

  // Colores para los estados
  const estadoColor = (estado: string) => {
    switch (estado) {
      case "Pago pendiente":
        return { backgroundColor: "#c6f6fa", color: "#3B2412" };
      case "En camino":
        return { backgroundColor: "#e9d6fa", color: "#3B2412" };
      case "Completado":
        return { backgroundColor: "#c6fadc", color: "#3B2412" };
      default:
        return { backgroundColor: "#eee", color: "#3B2412" };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.volverBtn}
          onPress={() => router.replace("/market")}
        >
          <Text style={styles.volverBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Historial de compras</Text>
        <View style={{ height: 12 }} />
        {compras.map((compra) => (
          <View key={compra.id} style={styles.card}>
            <Image source={{ uri: compra.portada }} style={styles.cover} />
            <View style={styles.infoCol}>
              <Text style={styles.infoText}>
                Libro: <Text style={styles.bold}>{compra.titulo}</Text>
              </Text>
              <Text style={styles.infoText}>
                Vendedor: <Text style={styles.bold}>{compra.vendedor}</Text>
              </Text>
              <Text style={styles.infoText}>
                Fecha de compra: <Text style={styles.bold}>{compra.fecha}</Text>
              </Text>
              <Text style={styles.infoText}>
                Tipo de entrega:{" "}
                <Text style={styles.bold}>{compra.tipoEntrega}</Text>
              </Text>
              <Text style={styles.infoText}>
                Estado:{" "}
                <Text style={[styles.estado, estadoColor(compra.estado)]}>
                  {compra.estado}
                </Text>
              </Text>
            </View>
          </View>
        ))}
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
    paddingTop: Platform.OS === "android" ? 38 : 18,
    paddingBottom: 8,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
  },
  volverBtn: {
    backgroundColor: "#3B2412",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: 8,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  volverBtnText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 18,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: "center",
  },
  cover: {
    width: 80,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#FFF4E4",
    marginRight: 16,
  },
  infoCol: {
    flex: 1,
    justifyContent: "center",
  },
  infoText: {
    color: "#3B2412",
    fontSize: 15,
    marginBottom: 2,
  },
  bold: {
    fontWeight: "bold",
  },
  estado: {
    fontWeight: "bold",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
    marginLeft: 4,
  },
});
