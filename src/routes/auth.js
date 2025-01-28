const express = require("express");
const {
  createUser,
  userLogin,
  getUserByEmail,
  getUsers,
} = require("../controllers/auth.controllers");

const routerAuth = express.Router();

routerAuth.post("/createUser", createUser);
routerAuth.post("/userLogin", userLogin);
routerAuth.get("/getUserByEmail", getUserByEmail);
routerAuth.get("/getUsers", getUsers);

module.exports = routerAuth;
