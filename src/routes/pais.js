const express = require("express");
const {
  crearPais,
  getPaises,
  getPaisByNombre,
  updatePais,
  deletePais,
} = require("../controllers/pais.controllers");

const routerPais = express.Router();

routerPais.post("/crearPais", crearPais);
routerPais.get("/getPaises", getPaises);
routerPais.get("/getPaisByNombre/:nombre", getPaisByNombre);
routerPais.put("/updatePais/:id", updatePais);
routerPais.delete("/deletePais/:id", deletePais);

module.exports = routerPais;
