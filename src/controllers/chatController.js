const OpenAI = require("openai");
require("dotenv").config();
const Beca = require("../models/beca-model");
const ChatSettings = require("../models/chatSettings-model");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función auxiliar para obtener la estructura de la base de datos
const obtenerEstructuraDB = async () => {
  try {
    // Obtener una beca de ejemplo para ver su estructura
    const becaEjemplo = await Beca.findOne();
    if (!becaEjemplo) return null;

    // Convertir a objeto plano para evitar problemas con Mongoose
    return JSON.parse(JSON.stringify(becaEjemplo));
  } catch (error) {
    console.error("Error al obtener estructura de la base de datos:", error);
    return null;
  }
};

// Función auxiliar para buscar becas según los criterios proporcionados
const buscarBecas = async (criterios) => {
  try {
    const query = {};

    // Construir la consulta dinámicamente basada en los criterios
    Object.entries(criterios).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Manejar campos anidados
        if (key.includes(".")) {
          query[key] = value;
        } else {
          query[key] = value;
        }
      }
    });

    const becas = await Beca.find(query).limit(10);
    return becas;
  } catch (error) {
    console.error("Error en buscarBecas:", error);
    return [];
  }
};

// Función auxiliar para contar el total de becas
const contarBecas = async () => {
  try {
    return await Beca.countDocuments();
  } catch (error) {
    console.error("Error al contar becas:", error);
    return 0;
  }
};

// Chat with GPT
const chatWithGPT = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Un mensaje es requerido",
      });
    }

    // Get active chat settings
    const settings = await ChatSettings.findOne({ isActive: true });
    if (!settings) {
      return res.status(500).json({
        success: false,
        message: "No se encontraron configuraciones activas para el chat",
      });
    }

    // Obtener la estructura de la base de datos
    const estructuraDB = await obtenerEstructuraDB();
    if (!estructuraDB) {
      return res.status(500).json({
        success: false,
        message: "No se pudo obtener la estructura de la base de datos",
      });
    }

    // Obtener el total de becas
    const totalBecas = await contarBecas();

    // Llamada a GPT para analizar y responder
    const completion = await openai.chat.completions.create({
      model: settings.model,
      messages: [
        {
          role: "system",
          content: `${settings.systemPrompt}

          Tienes acceso a una base de datos de becas con la siguiente estructura:
          ${JSON.stringify(estructuraDB, null, 2)}

          El total de becas en la base de datos es: ${totalBecas}

          Para buscar becas, responde con un objeto JSON que contenga los criterios de búsqueda.
          Ejemplo:
          {
            "buscar": {
              "pais": "Argentina",
              "areaEstudio": "Medicina"
            }
          }

          Si no necesitas buscar becas, responde con un objeto JSON vacío:
          {
            "buscar": {}
          }`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    // Analizar la respuesta de GPT
    const respuestaGPT = JSON.parse(completion.choices[0].message.content);
    let becasEncontradas = [];

    // Si GPT indica que necesita buscar, realizamos la búsqueda
    if (respuestaGPT.buscar && Object.keys(respuestaGPT.buscar).length > 0) {
      becasEncontradas = await buscarBecas(respuestaGPT.buscar);
    }

    // Segunda llamada a GPT para generar la respuesta final
    const respuestaFinal = await openai.chat.completions.create({
      model: settings.model,
      messages: [
        {
          role: "system",
          content: settings.systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
        {
          role: "assistant",
          content: JSON.stringify({
            becasEncontradas: becasEncontradas,
            totalBecas: totalBecas,
          }),
        },
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    });

    const response = respuestaFinal.choices[0].message.content;

    res.status(200).json({
      success: true,
      response: response,
      becasRelevantes: becasEncontradas.length > 0 ? becasEncontradas : null,
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

// Get current active chat settings
const getActiveSettings = async (req, res) => {
  try {
    const settings = await ChatSettings.findOne({ isActive: true });
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron configuraciones activas",
      });
    }
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener las configuraciones",
      error: error.message,
    });
  }
};

// Create new chat settings
const createSettings = async (req, res) => {
  try {
    // Deactivate all other settings
    await ChatSettings.updateMany({}, { isActive: false });

    const newSettings = new ChatSettings(req.body);
    const savedSettings = await newSettings.save();

    res.status(201).json({
      success: true,
      data: savedSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear las configuraciones",
      error: error.message,
    });
  }
};

// Update existing chat settings
const updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSettings = await ChatSettings.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedSettings) {
      return res.status(404).json({
        success: false,
        message: "Configuración no encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar las configuraciones",
      error: error.message,
    });
  }
};

// Get all chat settings (for admin purposes)
const getAllSettings = async (req, res) => {
  try {
    const settings = await ChatSettings.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener las configuraciones",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithGPT,
  getActiveSettings,
  createSettings,
  updateSettings,
  getAllSettings,
};
