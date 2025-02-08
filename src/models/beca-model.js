const { Schema, model } = require("mongoose");

const becaSchema = new Schema({
  paisOrigen: { type: String, required: true },
  regionOrigen: { type: String, required: true },
  nombreBeca: { type: String, required: true },
  cantCupos: { type: Number, required: false },
  nivelAcademico: { type: String, required: true },
  areaEstudio: { type: String, required: true },
  institucionPublicadora: { type: String, required: false },
  universidadDestino: { type: String, required: false },
  paisPostulante: { type: [String], required: true },
  entidadBecaria: { type: String, required: false },
  duración: {
    duracionMinima: { type: Number, required: false },
    duracionMaxima: { type: Number, required: false },
    duracionUnidad: { type: String, required: false },
  },
  fechaInicioAplicacion: { type: String, required: false },
  fechaFinAplicacion: { type: String, required: false },
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
    idiomasRequeridos: [
      {
        idioma: { type: String, required: false },
        nivelIdioma: { type: String, required: false },
      },
    ],
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
    matricula: { type: Boolean, required: false },
    estipendio: { type: Boolean, required: false },
    pasajes: { type: Boolean, required: false },
    seguroMedico: { type: Boolean, required: false },
    alojamiento: { type: Boolean, required: false },
    montoMensualMin: { type: Number, required: false },
    montoMensualMax: { type: Number, required: false },
  },
  informacionAdicional: {
    sitioWeb: { type: String, required: false },
    correoContacto: { type: String, required: false },
  },
});

module.exports = model("Beca", becaSchema);
