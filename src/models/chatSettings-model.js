const mongoose = require("mongoose");

const chatSettingsSchema = new mongoose.Schema({
  systemPrompt: {
    type: String,
    required: true,
    default:
      "Eres un asistente útil para TodoBeca, una plataforma de becas. Proporciona respuestas claras y concisas en español. Si se provee información de becas, utilízala para responder.",
  },
  temperature: {
    type: Number,
    required: true,
    default: 0.7,
    min: 0,
    max: 2,
  },
  maxTokens: {
    type: Number,
    required: true,
    default: 500,
  },
  model: {
    type: String,
    required: true,
    default: "gpt-3.5-turbo",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the updatedAt field
chatSettingsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ChatSettings", chatSettingsSchema);
