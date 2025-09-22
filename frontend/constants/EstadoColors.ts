// Constantes para colores de estado de compras/ventas
// Asegura consistencia entre comprador y vendedor

export const ESTADO_COLORS = {
  pago_pendiente: "#c6f6fa", // Azul claro
  encuentro: "#ffb3d9", // Rosa claro
  envio_pendiente: "#e9d6fa", // Púrpura claro
  en_camino: "#e9d6fa", // Púrpura claro (mismo que envío pendiente)
  comprador_confirmado: "#ffb74d", // Naranja claro
  vendedor_confirmado: "#81c784", // Verde claro
  completado: "#c6fadc", // Verde muy claro
  default: "#eee", // Gris claro
} as const;

export const ESTADO_TEXT_COLOR = "#3B2412"; // Color del texto (marrón oscuro)

// Función para obtener el color de fondo de un estado
export const getEstadoColor = (estado: string): string => {
  return (
    ESTADO_COLORS[estado as keyof typeof ESTADO_COLORS] || ESTADO_COLORS.default
  );
};

// Función para obtener el objeto completo de colores (fondo y texto)
export const getEstadoColorObject = (estado: string) => {
  return {
    backgroundColor: getEstadoColor(estado),
    color: ESTADO_TEXT_COLOR,
  };
};

// Función para obtener el texto legible del estado
export const getEstadoText = (estado: string): string => {
  switch (estado) {
    case "pago_pendiente":
      return "Pago pendiente";
    case "encuentro":
      return "Encuentro";
    case "envio_pendiente":
      return "Envío pendiente";
    case "en_camino":
      return "En camino";
    case "comprador_confirmado":
      return "Comprador confirmó";
    case "vendedor_confirmado":
      return "Vendedor confirmó";
    case "completado":
      return "Completado";
    default:
      return estado;
  }
};
