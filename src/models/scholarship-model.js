const { Schema, model } = require("mongoose");

const becaSchema = Schema({
  paisOrigen: { type: String, required: true },
  regionOrigen: { type: String, required: true },
  nombreBeca: { type: String, required: true },
  cantCupos: { type: Number, required: false },
  nivelAcademico: { type: String, required: true },
  areaEstudio: { type: String, required: true },
  institucionPublicadora: { type: String, required: true },
  paisPostulante: { type: [String], required: true },
  entidadBecaria: { type: String, required: true },
  duracionMinima: { type: Number, required: false },
  duracionMaxima: { type: Number, required: false },
  fechaInicioAplicacion: { type: String, required: true },
  fechaFinAplicacion: { type: String, required: true },
  tipoBeca: {
    type: String,
    enum: [
      "Doctorado",
      "Fondos para investigación",
      "Estancia de investigación",
      "Grado",
      "Maestría",
      "Posdoctorado",
      "Posgrado",
    ],
    required: true,
  },
  requisitos: {
    nivelAcademicoMin: { type: String, required: false },
    idiomaCondicion: { type: Boolean, required: false },
    idiomasRequeridos: { type: [String], required: false },
    avalUnivProcedencia: { type: Boolean, required: false },
    avalUnivDestino: { type: Boolean, required: false },
    edadMax: { type: Number, required: false },
    cartaRecomendacion: { type: Boolean, required: false },
    promedioCondicion: { type: Boolean, required: false },
    promedioMin: { type: Number, required: false },
    necesidadEconom: { type: Boolean, required: false },
    examenesRequeridos: { type: [String], required: false },
    otros: { type: [String], required: false },
  },
  cobertura: {
    matricula: { type: Boolean, required: true },
    estipendio: { type: Boolean, required: true },
    pasajes: { type: Boolean, required: true },
    seguroMedico: { type: Boolean, required: true },
    alojamiento: { type: Boolean, required: true },
    montoMensualMin: { type: Number, required: false },
    montoMensualMax: { type: Number, required: false },
  },
  informacionAdicional: {
    sitioWeb: { type: String, required: false },
    correoContacto: { type: String, required: false },
  },
});

module.exports = model("Beca", becaSchema);
