const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    grupo: { type: String, required: true, trim: true },
    subgrupo: { type: String, trim: true },
  },
  { _id: false }
);

const MovementSchema = new mongoose.Schema(
  {
    fecha: {
      type: String,
      required: true,
      trim: true,
      match: [
        /^\d{2}\/\d{2}\/\d{2}(\d{2})?$/,
        "Formato de fecha inválido (DD/MM/YY o DD/MM/YYYY)",
      ],
      set: (v) => String(v ?? "").trim(), // fuerza string
    },
    categoria: { type: CategorySchema, required: true },
    tipo: { type: String, enum: ["ingreso", "egreso"], required: true },
    monto: { type: Number, required: true },
    saldo: { type: Number },
    nota: { type: String, trim: true },
    source: { type: String, trim: true },
    identificador: { type: String, trim: true },
  },
  { _id: false }
);

const CashDatasetSchema = new mongoose.Schema(
  {
    datasetName: { type: String, required: true, unique: true, trim: true },
    originalFileName: { type: String, trim: true },
    importedBy: { type: String, trim: true },
    currency: { type: String, default: "ARS", trim: true },
    datasetType: {
      type: String,
      enum: [
        "cashflow",
        "inventory",
        "investment",
        "humanResources",
        "marketing",
        "sales",
        "other",
      ],
      default: "cashflow",
    },
    periodStart: {
      type: String,
      trim: true,
      match: [
        /^\d{2}\/\d{2}\/\d{2}(\d{2})?$/,
        "Formato de fecha inválido (DD/MM/YY o DD/MM/YYYY)",
      ],
      set: (v) => String(v ?? "").trim(),
    },
    periodEnd: {
      type: String,
      trim: true,
      match: [
        /^\d{2}\/\d{2}\/\d{2}(\d{2})?$/,
        "Formato de fecha inválido (DD/MM/YY o DD/MM/YYYY)",
      ],
      set: (v) => String(v ?? "").trim(),
    },
    movements: { type: [MovementSchema], default: [] },
  },
  {
    timestamps: { createdAt: "importedAt", updatedAt: "updatedAt" },
  }
);

const CashDataset = mongoose.model("CashDataset", CashDatasetSchema);

module.exports = { CashDataset };
