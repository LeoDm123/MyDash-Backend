const { Schema, model } = require("mongoose");

/**
 * Subdocumento: un movimiento individual dentro del dataset
 * Mantiene el diseño simple (tipo + monto) para consultas y agregaciones limpias
 */
const movementSchema = new Schema(
  {
    fecha: { type: Date, required: true }, // p.ej. 2024-02-02
    categoria: {
      grupo: { type: String, required: true, trim: true }, // ej "Hogar"
      subgrupo: { type: String, required: false, trim: true }, // ej "Comida"
    },
    tipo: {
      type: String,
      enum: ["ingreso", "egreso"],
      required: true,
    },
    monto: { type: Number, required: true, min: 0 }, // guardar siempre positivo
    saldo: { type: Number, required: false }, // saldo luego del movimiento (si viene del CSV)
    nota: { type: String, required: false, trim: true },
  },
  { _id: false } // al ser subdocumento no necesitamos _id por cada movimiento
);

// Normaliza: si por alguna razón llega monto negativo, lo forzamos positivo
movementSchema.pre("validate", function (next) {
  if (typeof this.monto === "number" && this.monto < 0) {
    this.monto = Math.abs(this.monto);
  }
  next();
});

/**
 * Documento principal: un dataset (archivo entero importado)
 * Guarda metadatos del archivo y un array con TODOS los movimientos
 */
const datasetSchema = new Schema(
  {
    // Metadatos del archivo/dataset
    datasetName: { type: String, required: true, trim: true }, // ej "Caja2024"
    originalFileName: { type: String, required: false, trim: true }, // ej "Caja2024.csv"

    importedAt: { type: Date, default: Date.now, index: true },
    importedBy: { type: String, required: false, trim: true }, // email/uid del usuario que importó

    // Rango temporal detectado en el dataset (útil para filtros)
    periodStart: { type: Date, required: false, index: true },
    periodEnd: { type: Date, required: false, index: true },

    currency: { type: String, default: "ARS" },

    // Resúmenes agregados (opcionales, precomputados al importar)
    totals: {
      ingresos: { type: Number, default: 0 },
      egresos: { type: Number, default: 0 },
      balance: { type: Number, default: 0 }, // ingresos - egresos
    },

    // AQUÍ va el array completo de movimientos del dataset
    movements: {
      type: [movementSchema],
      default: [],
      validate: {
        validator: function (arr) {
          // Evitar documentos gigantes (límite Mongo 16MB). Ajustalo a tu realidad.
          return Array.isArray(arr) && arr.length <= 50000;
        },
        message: "Demasiados movimientos en un solo dataset (máx 50k).",
      },
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    versionKey: false,
  }
);

// Índices útiles
datasetSchema.index({ datasetName: 1, importedAt: -1 });
datasetSchema.index({ "movements.fecha": 1 });
datasetSchema.index({ "movements.tipo": 1 });
datasetSchema.index({
  "movements.categoria.grupo": 1,
  "movements.categoria.subgrupo": 1,
});

// Totales automáticos si no los proveés
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

  // Periodo automático si no está
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
  movementSchema, // exporto también el sub-schema por si querés reutilizarlo en otro lado
};
