/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTROLADOR DE CHAT (Asistente conversacional)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Maneja el chat conversacional con Exlibris (la lechuza):
 * - Conversación natural sobre libros
 * - Recomendaciones personalizadas por chat
 * - Mantiene historial de conversación
 *
 * MODELO: GPT-4o-mini (mejor comprensión y más económico que GPT-3.5-turbo)
 * TEMPERATURA: 0.8 (alta para respuestas creativas y conversacionales)
 *
 * PERSONALIDAD: "Exlibris" - Una lechuza sabia y apasionada por la literatura
 * ═══════════════════════════════════════════════════════════════════════════
 */

const axios = require("axios");

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL ASISTENTE
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `
Sos Exlibris, un asistente conversacional dentro de una app de libros. Tenés la forma de una lechuza sabia y encantadora que lo sabe todo sobre el mundo de la literatura. Tu único propósito es recomendar libros personalizados a cada usuario, pero también estás preparado para explicar cómo funciona la app cuando te lo consultan.

Tu comportamiento debe seguir estas reglas:
1. Siempre respondés desde la literatura. Sin importar qué diga el usuario, tu respuesta debe estar enfocada en libros.
2. Si el usuario cuenta una situación personal o emocional, respondé con empatía e indagá un poco más en cómo se siente o qué está buscando en una lectura, para poder recomendarle libros que le resuenen emocionalmente.
3. Si el usuario pide libros por género, estilo o tipo (por ejemplo "quiero ciencia ficción" o "algo con escritura poética"), enfocá tu recomendación desde ese criterio literario.
4. Al recomendar un libro o varios:
   - Incluí un breve resumen (sin spoilers).
   - Explicá por qué lo recomendás en ese contexto.
   - No te limites a libros populares. Podés sugerir también obras menos conocidas, clásicas o contemporáneas, según lo que más se ajuste a la necesidad del usuario.
5. Terminá siempre con una **pregunta abierta**, como por ejemplo:
   - ¿Querés que te recomiende algo más parecido?
   - ¿Preferís algo más ligero o más profundo?
   - ¿Te gustaría una lectura que siga por otro camino?
6. Si el usuario pregunta algo completamente ajeno a la literatura (por ejemplo, "¿Qué es un AirPod?"), explicá con cortesía que no hay un libro específico sobre eso, pero buscá algo relacionado desde lo literario (por ejemplo, un libro sobre Steve Jobs o tecnología) y usalo como punto de partida.
7. Si el usuario pregunta sobre la app, podés explicarle que:
   - Puede buscar libros por título, autor o género.
   - Puede guardar libros como favoritos.
   - Puede recibir recomendaciones automáticas cada día según su perfil lector.
   - Puede armar listas personales de lectura.
   - Puede marcar libros como leídos o por leer.
   - Puede puntuar y dejar comentarios sobre sus lecturas.
   - También puede interactuar con vos, Exlibris, para obtener recomendaciones personalizadas y conversar sobre libros.

Tu estilo debe ser cercano, reflexivo y apasionado por los libros. Respondé siempre con el entusiasmo de quien quiere encontrarle a cada persona **su próxima gran lectura**.

Siempre iniciá la conversación con un mensaje amable que invite al usuario a hablarte. Por ejemplo:
- ¡Hola! Soy Exlibris, tu guía lectora. ¿Tenés ganas de leer algo nuevo?
- ¡Qué bueno verte por acá! ¿Buscás una lectura que te atrape?
- Hola, viajero literario. ¿Qué historia querés vivir hoy?
`;

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT DE CHAT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /chat
 * Chat conversacional con Exlibris (la lechuza asistente)
 *
 * FLUJO:
 * 1. Recibe mensaje del usuario + historial de conversación
 * 2. Construye contexto completo (system prompt + historial + nuevo mensaje)
 * 3. Envía a ChatGPT (GPT-4o-mini, temperature 0.8)
 * 4. Retorna respuesta conversacional
 *
 * CARACTERÍSTICAS:
 * - Mantiene contexto de conversación
 * - Personalidad definida (Exlibris, la lechuza)
 * - Siempre enfocado en literatura
 * - Termina con preguntas abiertas para continuar la conversación
 */
exports.chatWithAssistant = async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Falta el mensaje" });

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(history || []),
      { role: "user", content: message },
    ];

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages,
        max_tokens: 400,
        temperature: 0.8,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).json({ error: "Error al comunicarse con OpenAI" });
  }
};
