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
    const { message, userData } = req.body;
    console.log("💬 Nuevo mensaje recibido:", message);
    console.log(
      "👤 Datos del usuario:",
      userData ? "Proporcionados" : "No proporcionados"
    );

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

    // PASO 1: Extraer filtros de la consulta usando ChatGPT
    console.log("🔍 Paso 1: Extrayendo filtros de la consulta...");
    const filtroGPT = await openai.chat.completions.create({
      model: settings.model,
      messages: [
        {
          role: "system",
          content: extraerFiltrosPrompt,
        },
        { role: "user", content: message },
      ],
      temperature: 0,
      max_tokens: 300,
    });

    let filtros;
    try {
      filtros = JSON.parse(filtroGPT.choices[0].message.content);
    } catch (e) {
      console.log("⚠️ Error al parsear filtros:", e);
      filtros = {};
    }
    console.log("📋 Filtros extraídos:", filtros);

    // PASO 2: Extraer información del usuario si está disponible
    console.log("👤 Paso 2: Procesando información del usuario...");
    const userFilters = {};
    if (userData) {
      // Filtro por nacionalidad
      if (userData.personalData?.nationality) {
        userFilters.paisPostulante = userData.personalData.nationality;
      }

      // Filtro por idiomas
      if (userData.languages?.length > 0) {
        const idiomasUsuario = userData.languages.map((lang) => lang.language);
        userFilters["requisitos.idiomasRequeridos.idioma"] = {
          $in: idiomasUsuario,
        };
      }

      // Filtro por nivel académico
      if (userData.academicData?.length > 0) {
        const nivelesAcademicos = userData.academicData.map(
          (acad) => acad.degree
        );
        userFilters.nivelAcademico = { $in: nivelesAcademicos };
      }

      // Filtro por áreas de interés
      if (userData.scholarshipProfile?.areasOfInterest?.length > 0) {
        userFilters.areaEstudio = {
          $in: userData.scholarshipProfile.areasOfInterest,
        };
      }

      // Filtro por países de interés
      if (userData.scholarshipProfile?.countriesOfInterest?.length > 0) {
        userFilters.paisDestino = {
          $in: userData.scholarshipProfile.countriesOfInterest,
        };
      }

      // Filtro por tipos de beca de interés
      if (userData.scholarshipProfile?.scholarshipTypes?.length > 0) {
        userFilters.tipoBeca = {
          $in: userData.scholarshipProfile.scholarshipTypes,
        };
      }
    }
    console.log("📋 Filtros del usuario:", userFilters);

    // PASO 3: Construir query final y buscar becas
    console.log("🔍 Paso 3: Buscando becas...");
    const query = {};

    // Agregar filtros de la consulta
    for (const [key, value] of Object.entries(filtros)) {
      if (key.includes(".")) {
        const [parent, child] = key.split(".");
        if (!query[parent]) {
          query[parent] = {};
        }
        query[parent][child] = value;
      } else if (Array.isArray(value)) {
        query[key] = { $in: value };
      } else {
        query[key] = value;
      }
    }

    // Agregar filtros del usuario (solo si no existen en los filtros de la consulta)
    for (const [key, value] of Object.entries(userFilters)) {
      if (!query[key]) {
        query[key] = value;
      }
    }

    console.log("🔍 Query final:", JSON.stringify(query, null, 2));

    let becasFiltradas = await Beca.find(query)
      .select(
        "nombreBeca paisDestino regionDestino nivelAcademico tipoBeca areaEstudio cobertura requisitos informacionAdicional slug"
      )
      .limit(30);

    console.log("🔍 Becas encontradas:", becasFiltradas.length);

    // Si hay datos de usuario, verificar requisitos para cada beca
    if (userData) {
      becasFiltradas = becasFiltradas.map((beca) => {
        const cumple = cumpleRequisitos(userData, beca);
        return {
          ...beca.toObject(),
          cumpleRequisitos: cumple,
        };
      });
    }

    // PASO 4: Generar respuesta final con ChatGPT
    console.log("💬 Paso 4: Generando respuesta final...");
    const finalResponse = await openai.chat.completions.create({
      model: settings.model,
      messages: [
        {
          role: "system",
          content: settings.systemPrompt,
        },
        {
          role: "system",
          content: `${
            userData
              ? `Perfil del usuario:
          Datos personales:
          - Nacionalidad: ${
            userData.personalData?.nationality || "No especificada"
          }
          - Ciudad actual: ${
            userData.personalData?.currentCity || "No especificada"
          }
          - Grupos minoritarios: ${
            userData.personalData?.minorityGroups?.join(", ") || "Ninguno"
          }
          
          Datos académicos:
          ${
            userData.academicData
              ?.map(
                (acad) => `
          - Título: ${acad.degree}
          - Disciplina: ${acad.discipline}
          `
              )
              .join("\n") || "No hay datos académicos registrados"
          }
          
          Idiomas:
          ${
            userData.languages
              ?.map((lang) => `- ${lang.language}: ${lang.level}`)
              .join("\n") || "No hay idiomas registrados"
          }
          
          Considera esta información al generar la respuesta.`
              : ""
          }

          Estas son las becas encontradas según los filtros extraídos:
          ${JSON.stringify(becasFiltradas, null, 2)}

          Responde de manera clara y útil, considerando el perfil del usuario y sus intereses.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    });

    const response = finalResponse.choices[0].message.content;

    res.status(200).json({
      success: true,
      response,
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
