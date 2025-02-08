const express = require("express");
const {
  crearBeca,
  getBecas,
  getBecaById,
  updateBeca,
  deleteBeca,
} = require("../controllers/beca.controllers");

const routerBeca = express.Router();

routerBeca.post("/crearBeca", crearBeca);
routerBeca.get("/getBecas", getBecas);
routerBeca.get("/getBecaById/:id", getBecaById);
routerBeca.put("/updateBeca/:id", updateBeca);
routerBeca.delete("/deleteBeca/:id", deleteBeca);

module.exports = routerBeca;
