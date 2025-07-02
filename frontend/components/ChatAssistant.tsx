import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../constants/ApiConfig";

const BACKEND_URL = API_BASE_URL;

const lechuzaImg = require("../assets/images/lechuza.png");

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "¡Hola! Soy Exlibris, tu guía lectora. ¿Tenés ganas de leer algo nuevo?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          history: messages.filter((m) => m.role !== "system"),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Hubo un error, intenta de nuevo.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Hubo un error, intenta de nuevo." },
      ]);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Image source={lechuzaImg} style={styles.owl} />
        <Text style={styles.title}>Hablá con la Lechuza</Text>
        <TouchableOpacity
          style={styles.volverBtn}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.volverBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.messages}
        contentContainerStyle={{ padding: 16 }}
        ref={scrollViewRef}
      >
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.bubble,
              msg.role === "assistant"
                ? styles.assistantBubble
                : styles.userBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                msg.role === "user" && { color: "#fff4e4" },
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <ActivityIndicator color="#7c4a2d" />
          </View>
        )}
      </ScrollView>
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="¡Preguntá lo que quieras!"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={styles.sendBtnText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff4e4",
    padding: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomWidth: 2,
    borderBottomColor: "#e0d3c2",
    position: "relative",
  },
  owl: { width: 48, height: 48, marginRight: 12 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B2412",
    flex: 1,
    paddingRight: SCREEN_WIDTH < 400 ? 90 : SCREEN_WIDTH < 700 ? 120 : 200,
  },
  messages: { flex: 1, backgroundColor: "#ffffff" },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  assistantBubble: {
    backgroundColor: "#fff4e4",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
  },
  userBubble: {
    backgroundColor: "#332018",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
  },
  bubbleText: {
    color: "#3B2412",
    fontSize: 15,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0d3c2",
    padding: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    backgroundColor: "#f3e8da",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    color: "#3B2412",
    borderWidth: 0,
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  sendBtn: {
    backgroundColor: "#7c4a2d",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sendBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  volverBtn: {
    position: "absolute",
    right: SCREEN_WIDTH < 400 ? 8 : SCREEN_WIDTH < 700 ? 16 : 32,
    marginTop: SCREEN_WIDTH < 400 ? 8 : SCREEN_WIDTH < 700 ? 16 : 24,
    backgroundColor: "#332018",
    borderRadius: 30,
    paddingVertical: SCREEN_WIDTH < 400 ? 6 : SCREEN_WIDTH < 700 ? 8 : 12,
    paddingHorizontal: SCREEN_WIDTH < 400 ? 14 : SCREEN_WIDTH < 700 ? 22 : 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
    maxWidth: SCREEN_WIDTH < 400 ? 90 : SCREEN_WIDTH < 700 ? 120 : 200,
    maxHeight: SCREEN_WIDTH < 400 ? 32 : SCREEN_WIDTH < 700 ? 38 : 48,
  },
  volverBtnText: {
    color: "#fff4e4",
    fontWeight: "bold",
    fontSize: SCREEN_WIDTH < 400 ? 13 : SCREEN_WIDTH < 700 ? 16 : 20,
    letterSpacing: 1,
  },
});
