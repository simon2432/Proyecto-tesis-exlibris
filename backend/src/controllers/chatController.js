const axios = require("axios");

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
        model: "gpt-3.5-turbo",
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

exports.describeBook = async (req, res) => {
  const {
    title,
    authors,
    publisher,
    publishedDate,
    categories,
    language,
    pageCount,
  } = req.body;
  if (!title)
    return res.status(400).json({ error: "Falta el título del libro" });

  let bookInfo = `Título: ${title}`;
  if (authors) bookInfo += `\nAutor(es): ${authors}`;
  if (publisher) bookInfo += `\nEditorial: ${publisher}`;
  if (publishedDate) bookInfo += `\nAño de publicación: ${publishedDate}`;
  if (categories) bookInfo += `\nGénero(s): ${categories}`;
  if (language) bookInfo += `\nIdioma: ${language}`;
  if (pageCount) bookInfo += `\nCantidad de páginas: ${pageCount}`;

  const prompt = `Redactá una descripción extendida, informativa y atractiva para la ficha de una app de libros sobre el siguiente libro. Utilizá toda la información proporcionada. Si conocés el libro o tenés idea de qué trata, generá una descripción similar en extensión, tono y profundidad al ejemplo de referencia que sigue, sin spoilers y sin preguntas. Si no tenés información suficiente o no lo conocés, respondé solo: 'Descripción no encontrada'.\n\n${bookInfo}\n\nEjemplo de referencia:\nEn este libro el autor nos comparte cómo se puede alcanzar un estado de iluminación aquí y ahora; y que es posible vivir libre del sufrimiento, de la ansiedad y de la neurosis. Más de 4,000,000 ejemplares vendidos. El Bestseller #1 del New York Times. El clásico que consagró a Eckhart Tolle como uno de los gurús más importantes del mundo. El poder del ahora es un libro único. Tiene la capacidad de crear una experiencia en los lectores y de cambiar su vida. Hoy ya es considerado una obra maestra. "Uno de los mejores libros de los últimos años. Cada frase evoca verdad y poder." Deepak Chopra Para lograr la iluminación aquí y ahora sólo tenemos que comprender nuestro papel de creadores de nuestro dolor. Es nuestra propia mente la que causa nuestros problemas con su corriente constante de pensamientos, aferrándose al pasado, preocupándose por el futuro. Cometemos el error de identificarnos con ella, de pensar que eso es lo que somos, cuando de hecho somos seres mucho más grandes. Escrito en un formato de preguntas y respuestas que lo hace muy accesible, El poder del ahora es una invitación a la reflexión, que le abrirá las puertas a la plenitud espiritual y le permitirá ver la vida con nuevos ojos y empezar a disfrutar del verdadero poder del ahora.`;

  try {
    const messages = [
      {
        role: "system",
        content:
          "Sos un asistente que responde únicamente con descripciones extendidas, informativas y atractivas de libros para una app. Nunca incluyas preguntas ni spoilers. Si no conocés el libro o no tenés información suficiente, respondé solo: 'Descripción no encontrada'.",
      },
      { role: "user", content: prompt },
    ];

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 200,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ description: reply.trim() });
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).json({ error: "Error al comunicarse con OpenAI" });
  }
};
