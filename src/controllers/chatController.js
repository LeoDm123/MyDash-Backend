const OpenAI = require("openai");
require("dotenv").config();
const Beca = require("../models/beca-model");
const ChatSettings = require("../models/chatSettings-model");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función auxiliar para buscar becas relevantes
const buscarBecasRelevantes = async (query) => {
  try {
    // Convertir el query a minúsculas para búsqueda case-insensitive
    const queryLower = query.toLowerCase();

    // Buscar en múltiples campos que podrían ser relevantes
    const becas = await Beca.find({
      $or: [
        { nombreBeca: { $regex: queryLower, $options: "i" } },
        { "duracion.duracionMinima": { $regex: queryLower, $options: "i" } },
        { "duracion.duracionMaxima": { $regex: queryLower, $options: "i" } },
        { "duracion.duracionUnidad": { $regex: queryLower, $options: "i" } },
        { fechaInicioAplicacion: { $regex: queryLower, $options: "i" } },
        { fechaFinAplicacion: { $regex: queryLower, $options: "i" } },
        { fechaInicioPrograma: { $regex: queryLower, $options: "i" } },
        { tipoBeca: { $regex: queryLower, $options: "i" } },
        {
          "requisitos.nivelAcademicoMin": { $regex: queryLower, $options: "i" },
        },
        { "requisitos.idiomaCondicion": { $regex: queryLower, $options: "i" } },
        {
          "requisitos.idiomasRequeridos.idioma": {
            $regex: queryLower,
            $options: "i",
          },
        },
        {
          "requisitos.idiomasRequeridos.nivelIdioma": {
            $regex: queryLower,
            $options: "i",
          },
        },
        {
          "requisitos.avalUnivProcedencia": {
            $regex: queryLower,
            $options: "i",
          },
        },
        { "requisitos.avalUnivDestino": { $regex: queryLower, $options: "i" } },
        { "requisitos.edadMax": { $regex: queryLower, $options: "i" } },
        {
          "requisitos.cartaRecomendacion": {
            $regex: queryLower,
            $options: "i",
          },
        },
        {
          "requisitos.promedioCondicion": { $regex: queryLower, $options: "i" },
        },
        { "requisitos.promedioMin": { $regex: queryLower, $options: "i" } },
        { "requisitos.necesidadEconom": { $regex: queryLower, $options: "i" } },
        {
          "requisitos.examenesRequeridos": {
            $regex: queryLower,
            $options: "i",
          },
        },
        { "requisitos.otros": { $regex: queryLower, $options: "i" } },
        { "cobertura.matricula": { $regex: queryLower, $options: "i" } },
        { "cobertura.estipendio": { $regex: queryLower, $options: "i" } },
        { "cobertura.pasajes": { $regex: queryLower, $options: "i" } },
        { "cobertura.seguroMedico": { $regex: queryLower, $options: "i" } },
        { "cobertura.alojamiento": { $regex: queryLower, $options: "i" } },
        { "cobertura.montoMensualMin": { $regex: queryLower, $options: "i" } },
        { "cobertura.montoMensualMax": { $regex: queryLower, $options: "i" } },
        {
          "informacionAdicional.sitioWeb": {
            $regex: queryLower,
            $options: "i",
          },
        },
        {
          "informacionAdicional.correoContacto": {
            $regex: queryLower,
            $options: "i",
          },
        },
        { destacada: { $regex: queryLower, $options: "i" } },
        { dificultad: { $regex: queryLower, $options: "i" } },
        { imagen: { $regex: queryLower, $options: "i" } },
        { slug: { $regex: queryLower, $options: "i" } },
      ],
    });

    return becas;
  } catch (error) {
    console.error("Error en buscarBecasRelevantes:", error);
    return [];
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

    // 🔍 Búsqueda dinámica en la base de datos
    const becasRelevantes = await buscarBecasRelevantes(message);
    let infoExtra = "";

    if (becasRelevantes.length > 0) {
      infoExtra =
        "Basado en tu consulta, encontré las siguientes becas relevantes:\n\n";
      becasRelevantes.forEach((beca) => {
        infoExtra += `• ${beca.nombreBeca}\n`;
        infoExtra += `  País: ${beca.pais}\n`;
        infoExtra += `  Universidad: ${beca.universidad}\n`;
        if (beca.areaEstudio) infoExtra += `  Área: ${beca.areaEstudio}\n`;
        if (beca.descripcion)
          infoExtra += `  Descripción: ${beca.descripcion.substring(
            0,
            100
          )}...\n`;
        infoExtra += "\n";
      });
    }

    // 🧠 Construir el prompt con datos adicionales si los hay
    const promptUsuario = infoExtra ? `${message}\n\n${infoExtra}` : message;

    const completion = await openai.chat.completions.create({
      model: settings.model,
      messages: [
        {
          role: "system",
          content:
            settings.systemPrompt +
            "\n\nUtiliza la información de becas proporcionada para responder de manera precisa y relevante. Si no hay información relevante, indica que no encontraste becas específicas pero proporciona información general sobre el tema.",
        },
        {
          role: "user",
          content: promptUsuario,
        },
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    });

    const response = completion.choices[0].message.content;

    res.status(200).json({
      success: true,
      response: response,
      becasRelevantes: becasRelevantes.length > 0 ? becasRelevantes : null,
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
