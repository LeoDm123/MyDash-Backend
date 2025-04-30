const OpenAI = require("openai");
require("dotenv").config();
const Beca = require("../models/beca-model");
const ChatSettings = require("../models/chatSettings-model");
const Usuario = require("../models/user-model");
const { cumpleRequisitos } = require("../utils/scholarshipMatch");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

const chatWithGPT = async (req, res) => {
  try {
    const { message, userData, history = [] } = req.body;
    console.log("\ud83d\udcac Nuevo mensaje recibido:", message);
    console.log(
      "\ud83d\udc64 Datos del usuario:",
      userData ? "Proporcionados" : "No proporcionados"
    );

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

    console.log("\ud83d\udd0d Extrayendo filtros de la consulta...");
    const filtroGPT = await openai.chat.completions.create({
      model: settings.model,
      messages: [
        { role: "system", content: extraerFiltrosPrompt },
        { role: "user", content: message },
      ],
      temperature: 0,
      max_tokens: 300,
    });

    let filtros;
    try {
      filtros = JSON.parse(filtroGPT.choices[0].message.content);
      console.log("\ud83d\udccb Filtros extraídos:", filtros);
    } catch (e) {
      console.error("\u26a0\ufe0f Error al parsear filtros:", e);
      filtros = {};
    }

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
    console.log(
      "\u2705 Query basada en la consulta:",
      JSON.stringify(query, null, 2)
    );

    console.log(
      "\ud83d\udd0e Buscando becas que cumplen filtros de la consulta..."
    );
    let becasFiltradas = await Beca.find(query)
      .select(
        "nombreBeca paisPostulante paisDestino regionDestino nivelAcademico tipoBeca areaEstudio cobertura requisitos informacionAdicional slug"
      )
      .limit(30);

    console.log(
      `\ud83d\udd0e Becas encontradas tras consulta: ${becasFiltradas.length}`
    );

    if (userData) {
      becasFiltradas = becasFiltradas
        .map((beca) => {
          const cumple = cumpleRequisitos(userData, beca);
          const nombreBeca = beca.nombreBeca || "(sin nombre)";

          if (cumple === "Faltan Datos") {
            console.log(
              `\u26a0\ufe0f Faltan datos para evaluar: ${nombreBeca}`
            );
            return {
              ...beca.toObject(),
              cumpleRequisitos:
                "Cargar perfil para determinar si cumplís con los requisitos",
            };
          }

          if (cumple === true) {
            console.log(`\u2705 Cumple requisitos: ${nombreBeca}`);
            return {
              ...beca.toObject(),
              cumpleRequisitos: "Cumple con los requisitos",
            };
          }

          console.log(`\u274c No cumple requisitos: ${nombreBeca}`);
          return null;
        })
        .filter((beca) => beca !== null);
    } else {
      console.log(
        "\ud83e\uddd1 No hay datos del usuario ➔ No se realiza verificación de requisitos."
      );
      becasFiltradas = becasFiltradas.map((beca) => ({
        ...beca.toObject(),
        cumpleRequisitos:
          "Cargar perfil para determinar si cumplís con los requisitos",
      }));
    }

    console.log(
      `\ud83c\udfaf Total final de becas que se enviarán: ${becasFiltradas.length}`
    );

    console.log("\ud83d\udcac Generando respuesta final...");
    const fullMessages = [
      { role: "system", content: settings.systemPrompt },
      {
        role: "system",
        content: `${
          userData
            ? `Perfil del usuario:
        Nacionalidad: ${userData.personalData?.nationality || "No especificada"}
        Ciudad actual: ${
          userData.personalData?.currentCity || "No especificada"
        }
        Grupos minoritarios: ${
          userData.personalData?.minorityGroups?.join(", ") || "Ninguno"
        }

        Datos académicos:
        ${
          userData.academicData
            ?.map(
              (acad) =>
                `- Título: ${acad.degree} - Disciplina: ${acad.discipline}`
            )
            .join("\n") || "No hay datos académicos registrados"
        }

        Idiomas:
        ${
          userData.languages
            ?.map((lang) => `- ${lang.language}: ${lang.level}`)
            .join("\n") || "No hay idiomas registrados"
        }`
            : ""
        }

        Becas encontradas:
        ${JSON.stringify(becasFiltradas, null, 2)}

        Responde de manera clara y útil, considerando el perfil del usuario.`,
      },
      ...history,
      { role: "user", content: message },
    ];

    const finalResponse = await openai.chat.completions.create({
      model: settings.model,
      messages: fullMessages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    });

    const assistantReply = finalResponse.choices[0].message.content;

    res.status(200).json({
      success: true,
      response: assistantReply,
      newMessage: { role: "assistant", content: assistantReply },
    });
  } catch (error) {
    console.error("\u274c Error en chatWithGPT:", error);
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
