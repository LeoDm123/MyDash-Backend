const OpenAI = require("openai");
require("dotenv").config();
const Beca = require("../models/beca-model");
const ChatSettings = require("../models/chatSettings-model");
const Usuario = require("../models/user-model");
const { cumpleRequisitos } = require("../utils/scholarshipMatch");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const extraerFiltrosPrompt = `
Tu tarea es extraer filtros de búsqueda de una consulta en lenguaje natural sobre becas.
Debés devolver un objeto JSON con las claves relevantes según la base de datos.

Campos posibles:
- tipoBeca
- paisDestino
- regionDestinos
- paisPostulante
- areaEstudio
- nivelAcademico
- "cobertura.matricula"
- "cobertura.pasajes"
- "cobertura.alojamiento"
- "cobertura.estipendio"
- "cobertura.seguroMedico"
- "requisitos.nivelAcademicoMin"
- "requisitos.idiomasRequeridos.idioma"
- "requisitos.idiomasRequeridos.nivelIdioma"
- "requisitos.edadMax"
- "requisitos.cartaRecomendacion"

Solo devolvé un JSON plano con esos filtros, por ejemplo:
{
  "tipoBeca": "Maestría",
  "paisPostulante": "Argentina",
  "cobertura.pasajes": true
}
Si no hay filtros, devolvé: {}
`;

const esConsultaDeBecas = async (mensaje) => {
  const systemPrompt = `
Tu tarea es identificar si un mensaje del usuario está relacionado con la búsqueda de becas.
Respondé solo con "true" si el mensaje tiene la intención de buscar becas, o "false" si no la tiene.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: mensaje },
    ],
    temperature: 0,
    max_tokens: 10,
  });

  const content = response.choices[0].message.content.trim();
  return content.toLowerCase().includes("true");
};

const construirQueryDesdeFiltros = (filtros) => {
  const query = {};
  for (const [key, value] of Object.entries(filtros)) {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      if (!query[parent]) query[parent] = {};
      query[parent][child] = value;
    } else if (Array.isArray(value)) {
      query[key] = { $in: value };
    } else {
      query[key] = value;
    }
  }
  return query;
};

const chatWithGPT = async (req, res) => {
  try {
    const { message, userData, history = [] } = req.body;
    console.log("\n📝 ====== NUEVA CONVERSACIÓN ======");
    console.log("📩 Mensaje recibido:", message);
    console.log("👤 Estado del usuario:", userData ? "Logeado" : "No logeado");
    if (userData) {
      console.log("📋 Perfil del usuario:", JSON.stringify(userData, null, 2));
    }

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Un mensaje es requerido" });
    }

    const settings = await ChatSettings.findOne({ isActive: true });
    if (!settings) {
      return res.status(500).json({
        success: false,
        message: "No se encontraron configuraciones activas para el chat",
      });
    }

    let becasFiltradas = [];
    let respuestaConBecas = "";

    const esConsulta = await esConsultaDeBecas(message);
    console.log("🔍 ¿Es consulta de becas?:", esConsulta);

    if (esConsulta) {
      console.log("\n🔎 Extrayendo filtros de la consulta...");
      const filtroGPT = await openai.chat.completions.create({
        model: settings.model,
        messages: [
          { role: "system", content: extraerFiltrosPrompt },
          { role: "user", content: message },
        ],
        temperature: 0,
        max_tokens: 300,
      });

      let filtros = {};
      try {
        filtros = JSON.parse(filtroGPT.choices[0].message.content);
        console.log("✅ Filtros extraídos:", JSON.stringify(filtros, null, 2));
      } catch (e) {
        console.error("❌ Error al parsear filtros:", e);
      }

      const query = construirQueryDesdeFiltros(filtros);
      console.log("🔍 Query construida:", JSON.stringify(query, null, 2));

      becasFiltradas = await Beca.find(query)
        .select(
          "nombreBeca paisPostulante paisDestino regionDestino nivelAcademico tipoBeca areaEstudio cobertura requisitos informacionAdicional slug"
        )
        .limit(30)
        .lean();

      console.log(
        `📊 Becas encontradas antes de filtrar: ${becasFiltradas.length}`
      );

      if (userData) {
        console.log("\n👤 Aplicando filtros según perfil del usuario...");
        becasFiltradas = becasFiltradas
          .map((beca) => {
            const cumple = cumpleRequisitos(userData, beca);
            console.log(`📋 Beca "${beca.nombreBeca}": ${cumple}`);
            return {
              ...beca,
              cumpleRequisitos:
                cumple === true
                  ? "Cumple con los requisitos"
                  : cumple === "Faltan Datos"
                  ? "Cargar perfil para determinar si cumplís con los requisitos"
                  : null,
            };
          })
          .filter((b) => b.cumpleRequisitos !== null);
        console.log(
          `📊 Becas después de filtrar por perfil: ${becasFiltradas.length}`
        );
      }

      respuestaConBecas = `\nBecas encontradas:\n${JSON.stringify(
        becasFiltradas,
        null,
        2
      )}`;
    }

    const fullMessages = [
      { role: "system", content: settings.systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    if (userData) {
      console.log("\n📋 Agregando contexto del perfil del usuario...");
      const perfilContext = `
Información del perfil del usuario:
- País: ${userData.pais || "No especificado"}
- Nivel académico: ${userData.nivelAcademico || "No especificado"}
- Área de estudio: ${userData.areaEstudio || "No especificado"}
- Idiomas: ${
        userData.idiomas
          ? userData.idiomas
              .map((i) => `${i.idioma} (${i.nivelIdioma})`)
              .join(", ")
          : "No especificados"
      }
- Edad: ${userData.edad || "No especificada"}
- Tiene carta de recomendación: ${userData.cartaRecomendacion ? "Sí" : "No"}
`;
      console.log("📝 Contexto del perfil:", perfilContext);
      fullMessages.push({ role: "system", content: perfilContext });
    }

    if (respuestaConBecas) {
      console.log(
        "\n📊 Agregando información de becas encontradas al contexto..."
      );
      fullMessages.push({ role: "system", content: respuestaConBecas });
    }

    console.log("\n🤖 Generando respuesta con GPT...");
    const finalResponse = await openai.chat.completions.create({
      model: settings.model,
      messages: fullMessages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    });

    const assistantReply = finalResponse.choices[0].message.content;
    console.log("💬 Respuesta generada:", assistantReply);
    console.log("✅ ====== FIN DE LA CONVERSACIÓN ======\n");

    res.status(200).json({
      success: true,
      response: assistantReply,
      newMessage: { role: "assistant", content: assistantReply },
      becas: becasFiltradas,
    });
  } catch (error) {
    console.error("\n❌ Error en chatWithGPT:", error);
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
