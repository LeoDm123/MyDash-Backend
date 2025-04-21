const OpenAI = require("openai");
require("dotenv").config();
const Beca = require("../models/Beca"); // Ajustá si tu modelo está en otra ruta

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatWithGPT = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Un mensaje es requerido",
      });
    }

    // 🔍 Búsqueda condicional en Mongo (ejemplo básico: menciona 'Argentina')
    let infoExtra = "";
    if (message.toLowerCase().includes("argentina")) {
      const becas = await Beca.find({ pais: "Argentina" }).limit(3);
      if (becas.length > 0) {
        infoExtra =
          "Estas son algunas becas en Argentina:\n" +
          becas.map((beca) => `• ${beca.nombreBeca}`).join("\n");
      }
    }

    // 🧠 Construir el prompt con datos adicionales si los hay
    const promptUsuario = infoExtra ? `${message}\n\n${infoExtra}` : message;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente útil para TodoBeca, una plataforma de becas. Proporciona respuestas claras y concisas en español. Si se provee información de becas, utilízala para responder.",
        },
        {
          role: "user",
          content: promptUsuario,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;

    res.status(200).json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error("Error en chatWithGPT:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar tu solicitud",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithGPT,
};
