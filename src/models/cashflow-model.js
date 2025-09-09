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

datasetSchema.pre("save", function (next) {
  if (!this.movements || this.movements.length === 0) {
    this.totals = { ingresos: 0, egresos: 0, balance: 0 };
    return next();
  }
  let ingresos = 0;
  let egresos = 0;
  for (const m of this.movements) {
    if (m?.tipo === "ingreso") ingresos += m.monto || 0;
    else if (m?.tipo === "egreso") egresos += m.monto || 0;
  }
  this.totals.ingresos = ingresos;
  this.totals.egresos = egresos;
  this.totals.balance = ingresos - egresos;

  if (!this.periodStart || !this.periodEnd) {
    const fechas = this.movements
      .map((m) => m.fecha)
      .filter(Boolean)
      .sort((a, b) => a - b);
    if (fechas.length > 0) {
      this.periodStart = this.periodStart || fechas[0];
      this.periodEnd = this.periodEnd || fechas[fechas.length - 1];
    }
  }
  next();
});

const CashDataset = model("CashDataset", datasetSchema);

module.exports = {
  CashDataset,
  movementSchema,
};
