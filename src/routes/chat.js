const express = require("express");
const {
  chatWithGPT,
  getActiveSettings,
  createSettings,
  updateSettings,
  getAllSettings,
} = require("../controllers/chatController");

const routerChat = express.Router();

routerChat.post("/chat", chatWithGPT);
routerChat.get("/getActiveSettings/active", getActiveSettings);
routerChat.get("/getAllSettings", getAllSettings);
routerChat.post("/createSettings", createSettings);
routerChat.put("/updateSettings/:id", updateSettings);

module.exports = routerChat;
