const express = require("express");
const {
  createUser,
  userLogin,
  getUserByEmail,
  getUsers,
} = require("../controllers/auth.controllers");

//va a ser el nombre del router que definamos
const routerAuth = express.Router();

//peticion get       Req = solicitud, va a estar esperando datos del FrontEnd
routerAuth.post("/createUser", createUser);
routerAuth.post("/userLogin", userLogin);
routerAuth.get("/getUserByEmail", getUserByEmail);
routerAuth.get("/getUsers", getUsers);

//module.exports es como vamos a exportar nuestros archivos
module.exports = routerAuth;
