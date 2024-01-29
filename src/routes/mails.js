const express = require("express");
const {
  createMailCampaign,
  fetchMailCampaigns,
  fetchMailCampaignsByID,
  deleteMailCampaignByID,
  editMailCampaignByID,
} = require("../controllers/mail.controllers");

const routerMail = express.Router();

routerMail.post("/createMailCampaign", createMailCampaign);
routerMail.get("/fetchMailCampaigns", fetchMailCampaigns);
routerMail.get("/fetchMailCampaignsByID/:_id", fetchMailCampaignsByID);
routerMail.delete("/deleteMailCampaignByID/:_id", deleteMailCampaignByID);
routerMail.put("/editMailCampaignByID/:_id", editMailCampaignByID);

module.exports = routerMail;
