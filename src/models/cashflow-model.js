const { Schema, model } = require("mongoose");

const movementSchema = new Schema(
  {
    fecha: { type: Date, required: true },
    categoria: {
      grupo: { type: String, required: true, trim: true },
      subgrupo: { type: String, required: false, trim: true },
    },
    tipo: {
      type: String,
      enum: ["ingreso", "egreso"],
      required: true,
    },
    monto: { type: Number, required: true, min: 0 },
    saldo: { type: Number, required: false },
    nota: { type: String, required: false, trim: true },
  },
  { _id: false }
);

movementSchema.pre("validate", function (next) {
  if (typeof this.monto === "number" && this.monto < 0) {
    this.monto = Math.abs(this.monto);
  }
  next();
});

const datasetSchema = new Schema(
  {
    datasetName: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: false, trim: true },

    importedAt: { type: Date, default: Date.now, index: true },
    importedBy: { type: String, required: false, trim: true },

    periodStart: { type: Date, required: false, index: true },
    periodEnd: { type: Date, required: false, index: true },

    currency: { type: String, default: "ARS" },

    datasetType: {
      type: String,
      required: false,
      trim: true,
      enum: [
        "cashflow",
        "inventory",
        "investment",
        "humanResources",
        "marketing",
        "sales",
        "other",
      ],
    },

    movements: {
      type: [movementSchema],
      default: [],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length <= 50000;
        },
        message: "Demasiados movimientos en un solo dataset (máx 50k).",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

datasetSchema.index({ datasetName: 1, importedAt: -1 });
datasetSchema.index({ "movements.fecha": 1 });
datasetSchema.index({ "movements.tipo": 1 });
datasetSchema.index({
  "movements.categoria.grupo": 1,
  "movements.categoria.subgrupo": 1,
});

// Crear modelos específicos para cada tipo
const CashDataset = model("CashDataset", datasetSchema);
const InventoryDataset = model("InventoryDataset", datasetSchema);
const InvestmentDataset = model("InvestmentDataset", datasetSchema);
const HumanResourcesDataset = model("HumanResourcesDataset", datasetSchema);
const MarketingDataset = model("MarketingDataset", datasetSchema);
const SalesDataset = model("SalesDataset", datasetSchema);
const OtherDataset = model("OtherDataset", datasetSchema);

// Mapeo de tipos a modelos
const datasetModels = {
  cashflow: CashDataset,
  inventory: InventoryDataset,
  investment: InvestmentDataset,
  humanResources: HumanResourcesDataset,
  marketing: MarketingDataset,
  sales: SalesDataset,
  other: OtherDataset,
};

// Función para obtener el modelo correcto según el tipo
function getDatasetModel(datasetType) {
  return datasetModels[datasetType] || OtherDataset;
}

// Función para obtener todos los modelos
function getAllDatasetModels() {
  return Object.values(datasetModels);
}

module.exports = {
  CashDataset,
  InventoryDataset,
  InvestmentDataset,
  HumanResourcesDataset,
  MarketingDataset,
  SalesDataset,
  OtherDataset,
  movementSchema,
  datasetModels,
  getDatasetModel,
  getAllDatasetModels,
};
