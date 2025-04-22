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
    console.log("🔍 Buscando becas relevantes para:", query);

    // Verificar la conexión a la base de datos
    const db = require("mongoose").connection;
    if (db.readyState !== 1) {
      console.error("❌ La base de datos no está conectada");
      throw new Error("La base de datos no está conectada");
    }

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
        { imagen: { $regex: queryLower, $options: "i" } },
        { slug: { $regex: queryLower, $options: "i" } },
      ],
    });

    console.log(`✅ Encontradas ${becas.length} becas relevantes`);
    return becas;
  } catch (error) {
    console.error("❌ Error en buscarBecasRelevantes:", error);
    throw error; // Propagar el error para manejarlo en el controlador principal
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

    console.log("💬 Nuevo mensaje recibido:", message);

    // Get active chat settings
    const settings = await ChatSettings.findOne({ isActive: true });
    if (!settings) {
      console.error(
        "❌ No se encontraron configuraciones activas para el chat"
      );
      return res.status(500).json({
        success: false,
        message: "No se encontraron configuraciones activas para el chat",
      });
    }

    console.log("⚙️ Configuración del chat cargada:", settings.model);

    // 🔍 Búsqueda dinámica en la base de datos
    let becasRelevantes = [];
    try {
      becasRelevantes = await buscarBecasRelevantes(message);
    } catch (error) {
      console.error("❌ Error al buscar becas:", error);
      // Continuar sin becas en caso de error
    }

    let infoExtra = "";

    if (becasRelevantes.length > 0) {
      infoExtra = "Información de becas relevantes encontradas:\n\n";
      becasRelevantes.forEach((beca) => {
        infoExtra += `• ${beca.nombreBeca}\n`;
        infoExtra += `  País: ${beca.pais}\n`;
        infoExtra += `  Universidad: ${beca.universidad}\n`;
        if (beca.areaEstudio) infoExtra += `  Área: ${beca.areaEstudio}\n`;
        if (beca.tipoBeca) infoExtra += `  Tipo: ${beca.tipoBeca}\n`;
        if (beca.duracion) {
          infoExtra += `  Duración: ${beca.duracion.duracionMinima} - ${beca.duracion.duracionMaxima} ${beca.duracion.duracionUnidad}\n`;
        }
        if (beca.cobertura) {
          const coberturas = [];
          if (beca.cobertura.matricula) coberturas.push("Matrícula");
          if (beca.cobertura.estipendio) coberturas.push("Estipendio");
          if (beca.cobertura.pasajes) coberturas.push("Pasajes");
          if (beca.cobertura.seguroMedico) coberturas.push("Seguro Médico");
          if (beca.cobertura.alojamiento) coberturas.push("Alojamiento");
          if (coberturas.length > 0) {
            infoExtra += `  Cobertura: ${coberturas.join(", ")}\n`;
          }
        }
        infoExtra += "\n";
      });
    }

    // 🧠 Construir el prompt con datos adicionales si los hay
    const promptUsuario = infoExtra ? `${message}\n\n${infoExtra}` : message;

    console.log("🤖 Enviando prompt a OpenAI...");
    const completion = await openai.chat.completions.create({
      model: settings.model,
      messages: [
        {
          role: "system",
          content: settings.systemPrompt,
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
    console.log("✅ Respuesta generada exitosamente");

    res.status(200).json({
      success: true,
      response: response,
      becasRelevantes: becasRelevantes.length > 0 ? becasRelevantes : null,
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
