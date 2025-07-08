import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Pressable,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../contexts/UserContext";
import { useRouter } from "expo-router";

const MENU_OPTIONS = [
  { label: "Editar perfil", onPress: () => {} },
  { label: "Soporte", onPress: () => {} },
  { label: "Políticas", onPress: () => {} },
  { label: "Cerrar sesión", onPress: () => {} },
];

export default function HeaderPerfil() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { logout } = useUser();
  const router = useRouter();

  const toggleMenu = () => {
    setMenuVisible((prev) => !prev);
    Animated.timing(fadeAnim, {
      toValue: menuVisible ? 0 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    router.replace("/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const MENU_OPTIONS = [
    { label: "Editar perfil", onPress: () => router.push("/editar-perfil") },
    { label: "Soporte", onPress: () => router.push("/soporte") },
    { label: "Políticas", onPress: () => router.push("/politicas") },
    { label: "Cerrar sesión", onPress: handleLogout },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logoLechuza.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={{ position: "relative" }}>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Ionicons name="menu" size={32} color="#3B2412" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Menú desplegable como Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={toggleMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={toggleMenu}>
          <Animated.View style={[styles.menuDropdown, { opacity: fadeAnim }]}>
            {MENU_OPTIONS.map((option, idx) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.menuItem,
                  idx === MENU_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => {
                  setMenuVisible(false);
                  setTimeout(() => option.onPress(), 100);
                }}
              >
                <Text style={styles.menuItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
      {/* Modal de logout */}
      {showLogoutModal && (
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
          onRequestClose={cancelLogout}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>¿Cerrar sesión?</Text>
              <Text style={styles.modalMessage}>
                Se cerrará tu sesión en Exlibris.
              </Text>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={cancelLogout}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={confirmLogout}
                >
                  <Text style={styles.modalDeleteText}>Cerrar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff4e4",
  },
  header: {
    backgroundColor: "#fff4e4",
    paddingTop: Platform.OS === "android" ? 5 : Platform.OS === "web" ? 10 : 28,
    paddingBottom: 12,
    paddingHorizontal: "4%",
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 0,
    paddingLeft: 0,
    position: "relative",
    left: 0,
    top: 0,
    width: "auto",
    height: 44,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 44,
    resizeMode: "contain",
    marginTop: 0,
    marginBottom: 20,
    marginLeft: 0,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3B2412",
    letterSpacing: 1.5,
  },
  menuButton: {
    padding: 6,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: -100,
    bottom: -100,
    zIndex: 20,
  },
  menuDropdown: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#FFF4E4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#b8a88a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    minWidth: 170,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d3c2",
    backgroundColor: "#FFF4E4",
  },
  menuItemText: {
    fontSize: 18,
    color: "#3B2412",
    fontWeight: "bold",
    textAlign: "left",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 28,
    minWidth: 270,
    alignItems: "center",
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
  modalMessage: {
    fontSize: 16,
    color: "#3B2412",
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },
  modalCancelBtn: {
    backgroundColor: "#e0d3c2",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginRight: 6,
  },
  modalCancelText: {
    color: "#3B2412",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalDeleteBtn: {
    backgroundColor: "#c0392b",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginLeft: 6,
  },
  modalDeleteText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
