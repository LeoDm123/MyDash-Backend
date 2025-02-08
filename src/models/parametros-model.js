const { Schema, model } = require("mongoose");

const parametrosSchema = new Schema(
  {
    idiomas: {
      type: [String],
      default: [],
    },
    paises: {
      type: [String],
      default: [],
    },
    monedas: {
      type: [String],
      default: [],
    },
  },
  { collection: "Parametros" }
);

module.exports = model("Parametros", parametrosSchema);
