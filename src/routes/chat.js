const express = require("express");
const { chatWithGPT } = require("../controllers/chatController");

const routerChat = express.Router();

routerChat.post("/chat", chatWithGPT);

module.exports = routerChat;
