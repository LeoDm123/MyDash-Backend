const express = require("express");
const {
  createUser,
  verifyEmail,
  userLogin,
  getUserByEmail,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  sendPasswordResetEmail,
  sendVerificationEmail,
  resetPassword,
  generarSitemapController,
} = require("../controllers/auth.controllers");

const routerAuth = express.Router();

routerAuth.post("/createUser", createUser);
routerAuth.get("/verifyEmail", verifyEmail);
routerAuth.post("/userLogin", userLogin);
routerAuth.get("/getUserByEmail", getUserByEmail);
routerAuth.get("/getUsers", getUsers);
routerAuth.get("/getUserById/:id", getUserById);
routerAuth.put("/updateUser/:id", updateUser);
routerAuth.delete("/deleteUser/:id", deleteUser);
routerAuth.post("/sendPasswordResetEmail", sendPasswordResetEmail);
routerAuth.post("/sendVerificationEmail", sendVerificationEmail);
routerAuth.put("/resetPassword", resetPassword);
routerAuth.get("/generarSitemap", generarSitemapController);

module.exports = routerAuth;
