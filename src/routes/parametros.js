const express = require("express");
const {
  getParametros,
  addIdioma,
  addMultiplesIdiomas,
  updateIdioma,
  deleteIdioma,
  addPais,
  addMultiplesPaises,
  updatePais,
  deletePais,
} = require("../controllers/parametros.controllers");

const routerParametros = express.Router();

routerParametros.get("/getParametros", getParametros);

routerParametros.post("/addIdioma", addIdioma);
routerParametros.post("/addMultiplesIdiomas", addMultiplesIdiomas);
routerParametros.put("/updateIdioma/:oldName", updateIdioma);
routerParametros.delete("/deleteIdioma/:nombre", deleteIdioma);

routerParametros.post("/addPais", addPais);
routerParametros.post("/addMultiplesPaises", addMultiplesPaises);
routerParametros.put("/addPais/:oldName", updatePais);
routerParametros.delete("/deletePais/:nombre", deletePais);

module.exports = routerParametros;
