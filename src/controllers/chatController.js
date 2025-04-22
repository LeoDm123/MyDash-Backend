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
    console.log("🔍 Intentando obtener estructura de la base de datos...");

    // Obtener una beca de ejemplo
    const becaEjemplo = await Beca.findOne();
    console.log("📄 Beca ejemplo encontrada:", becaEjemplo ? "Sí" : "No");

    if (!becaEjemplo) {
      console.log("❌ No se encontró ninguna beca en la base de datos");
      return null;
    }

    // Convertir a objeto plano y limpiar campos innecesarios
    const estructura = JSON.parse(JSON.stringify(becaEjemplo));

    // Eliminar campos que no son relevantes para la búsqueda
    delete estructura._id;
    delete estructura.__v;
    delete estructura.createdAt;
    delete estructura.updatedAt;

    console.log("✅ Estructura obtenida:", JSON.stringify(estructura, null, 2));
    return estructura;
  } catch (error) {
    console.error("❌ Error al obtener estructura de la base de datos:", error);
    return null;
  }
};

// Función auxiliar para buscar becas según los criterios proporcionados
const buscarBecas = async (criterios) => {
  try {
    console.log(
      "🔍 Buscando becas con criterios:",
      JSON.stringify(criterios, null, 2)
    );

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

    console.log("🔍 Query construido:", JSON.stringify(query, null, 2));
    const becas = await Beca.find(query).limit(10);
    console.log(`✅ Encontradas ${becas.length} becas`);

    return becas;
  } catch (error) {
    console.error("❌ Error en buscarBecas:", error);
    return [];
  }
};

// Función auxiliar para contar el total de becas
const contarBecas = async () => {
  try {
    const total = await Beca.countDocuments();
    console.log(`📊 Total de becas en la base de datos: ${total}`);
    return total;
  } catch (error) {
    console.error("❌ Error al contar becas:", error);
    return 0;
  }
};

// Función auxiliar para extraer JSON de una cadena
const extraerJSON = (texto) => {
  try {
    console.log("📝 Intentando extraer JSON de:", texto);

    // Buscar el primer { y el último }
    const inicio = texto.indexOf("{");
    const fin = texto.lastIndexOf("}");

    if (inicio === -1 || fin === -1) {
      console.log("⚠️ No se encontró JSON en la respuesta");
      return { buscar: {} };
    }

    const jsonStr = texto.substring(inicio, fin + 1);
    console.log("📦 JSON extraído:", jsonStr);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("❌ Error al extraer JSON:", error);
    return { buscar: {} };
  }
};

// Chat with GPT
const chatWithGPT = async (req, res) => {
  try {
    const { message } = req.body;
    console.log("💬 Nuevo mensaje recibido:", message);

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Un mensaje es requerido",
      });
    }

    // Get active chat settings
    const settings = await ChatSettings.findOne({ isActive: true });
    if (!settings) {
      console.error("❌ No se encontraron configuraciones activas");
      return res.status(500).json({
        success: false,
        message: "No se encontraron configuraciones activas para el chat",
      });
    }

    console.log("⚙️ Configuración del chat cargada:", settings.model);

    // Obtener la estructura de la base de datos
    const estructuraDB = await obtenerEstructuraDB();
    if (!estructuraDB) {
      console.error("❌ No se pudo obtener la estructura de la base de datos");
      return res.status(500).json({
        success: false,
        message: "No se pudo obtener la estructura de la base de datos",
      });
    }

    // Obtener el total de becas
    const totalBecas = await contarBecas();

    // Llamada a GPT para analizar y responder
    console.log("🤖 Enviando mensaje a GPT para análisis...");
    const completion = await openai.chat.completions.create({
      model: settings.model,
      messages: [
        {
          role: "system",
          content: `${settings.systemPrompt}

          Tienes acceso a una base de datos de becas con la siguiente estructura:
          ${JSON.stringify(estructuraDB, null, 2)}

          El total de becas en la base de datos es: ${totalBecas}

          IMPORTANTE: Debes responder SOLO con un objeto JSON que contenga los criterios de búsqueda.
          Si necesitas buscar becas, usa este formato:
          {
            "buscar": {
              "pais": "Argentina",
              "areaEstudio": "Medicina"
            }
          }

          Si no necesitas buscar becas, responde con:
          {
            "buscar": {}
          }

          NO incluyas ningún otro texto en tu respuesta.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    });

    console.log(
      "📥 Respuesta de GPT recibida:",
      completion.choices[0].message.content
    );

    // Analizar la respuesta de GPT de manera segura
    const respuestaGPT = extraerJSON(completion.choices[0].message.content);
    let becasEncontradas = [];

    // Si GPT indica que necesita buscar, realizamos la búsqueda
    if (respuestaGPT.buscar && Object.keys(respuestaGPT.buscar).length > 0) {
      becasEncontradas = await buscarBecas(respuestaGPT.buscar);
    }

    // Segunda llamada a GPT para generar la respuesta final
    console.log("🤖 Generando respuesta final...");
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
    console.log("✅ Respuesta final generada");

    res.status(200).json({
      success: true,
      response: response,
      becasRelevantes: becasEncontradas.length > 0 ? becasEncontradas : null,
    });
  } catch (error) {
    console.error("❌ Error en chatWithGPT:", error);
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
