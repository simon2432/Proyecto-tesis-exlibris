import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";

export default function PoliticasScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isMobile ? 18 : 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Políticas de la App</Text>

        {/* Introducción */}
        <Text style={styles.sectionTitle}>Introducción</Text>
        <Text style={styles.text}>
          Bienvenido a ExLibris. Nuestra misión es fomentar la lectura, el
          intercambio y la valoración de libros entre usuarios de manera segura
          y responsable. Este documento describe nuestras políticas de
          privacidad, uso, seguridad y comportamiento dentro de la plataforma.
        </Text>

        {/* Funciones de la aplicación */}
        <Text style={styles.sectionTitle}>Funciones de la aplicación</Text>
        <Text style={styles.text}>
          ExLibris permite:
          {"\n"}- Buscar y agregar libros a tu biblioteca personal y favoritos.
          {"\n"}- Registrar tu historial de lecturas y dejar reseñas con o sin
          spoilers.
          {"\n"}- Comprar y vender libros usados entre usuarios, con pasos de
          verificación y seguimiento.
          {"\n"}- Chatear con otros usuarios para coordinar compras, ventas o
          intercambios.
          {"\n"}- Personalizar tu perfil y gestionar tus datos personales.
        </Text>

        {/* Política de privacidad y protección de datos */}
        <Text style={styles.sectionTitle}>
          Política de privacidad y protección de datos
        </Text>
        <Text style={styles.text}>
          Recopilamos únicamente los datos necesarios para el funcionamiento de
          la app: nombre, correo electrónico, foto de perfil, comentarios,
          favoritos, historial de lecturas y transacciones. Esta información se
          utiliza para personalizar tu experiencia, ofrecer recomendaciones,
          mejorar la plataforma y garantizar la seguridad de las operaciones.
          {"\n"}
          Tus datos están protegidos mediante cifrado y acceso restringido.
          Nunca compartimos tu información con terceros sin tu consentimiento,
          salvo requerimiento legal. Puedes solicitar la eliminación de tu
          cuenta y datos en cualquier momento.
        </Text>

        {/* Seguridad y verificación de ventas */}
        <Text style={styles.sectionTitle}>
          Seguridad y verificación de ventas
        </Text>
        <Text style={styles.text}>
          Todas las transacciones de compra-venta pasan por un proceso de
          verificación en varios pasos:
          {"\n"}1. El comprador inicia la compra y el vendedor recibe una
          notificación.
          {"\n"}2. El vendedor debe confirmar la disponibilidad y el estado del
          libro.
          {"\n"}3. El comprador realiza el pago a través de un método seguro.
          {"\n"}4. El vendedor confirma el envío o entrega del libro.
          {"\n"}5. El comprador debe marcar la recepción del libro para
          finalizar la operación.
          {"\n"}
          El equipo de ExLibris puede intervenir en caso de disputas o
          problemas, y monitorea las transacciones para prevenir fraudes o
          actividades sospechosas.
        </Text>

        {/* Uso responsable y convivencia */}
        <Text style={styles.sectionTitle}>Uso responsable y convivencia</Text>
        <Text style={styles.text}>
          Está prohibido publicar contenido ofensivo, violento, discriminatorio,
          ilegal o que infrinja derechos de autor. Los comentarios con spoilers
          deben ser marcados como tal para respetar la experiencia de otros
          lectores. Nos reservamos el derecho de eliminar cualquier contenido
          inapropiado o que no cumpla con estas normas, y de suspender cuentas
          en caso de reincidencia.
        </Text>

        {/* Licencia y propiedad intelectual */}
        <Text style={styles.sectionTitle}>
          Licencia y propiedad intelectual
        </Text>
        <Text style={styles.text}>
          ExLibris y su contenido (diseño, código, imágenes, textos) están
          protegidos por derechos de autor. Los usuarios no pueden reutilizar,
          copiar o distribuir material de la app sin autorización previa. Las
          reseñas y comentarios publicados por los usuarios son responsabilidad
          de sus autores.
        </Text>

        {/* Contacto y soporte */}
        <Text style={styles.sectionTitle}>Contacto y soporte</Text>
        <Text style={styles.text}>
          Si tienes dudas legales, sobre privacidad o necesitas soporte, puedes
          contactarnos en: soporte@exlibris.com. También puedes utilizar el
          formulario de contacto disponible en la app.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Aceptar</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3B2412",
    marginBottom: 18,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7c4a2d",
    marginTop: 24,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: "#3B2412",
    marginBottom: 8,
    lineHeight: 22,
    textAlign: "justify",
  },
  button: {
    marginTop: 36,
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
});
