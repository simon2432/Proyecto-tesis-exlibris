import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo principal */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logoLechuza.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      {/* subtítulo */}
      <Text style={styles.subtitle}>Descubrí mundos, página por página</Text>
      {/* Botones */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.buttonText}>REGISTER</Text>
        </TouchableOpacity>
      </View>
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
  logoContainer: {
    marginBottom: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 110,
  },
  logo: {
    width: 250,
    height: 250,
  },
  subtitle: {
    fontSize: 15,
    color: "#7c4a2d",
    marginBottom: 40,
    textAlign: "center",
    fontWeight: "600",
  },
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#332018",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 30,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  buttonText: {
    color: "#f3e8da",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
