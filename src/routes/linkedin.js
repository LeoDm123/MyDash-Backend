const express = require("express");
const {
  createLinkedInCampaign,
  fetchLinkedInCampaigns,
  fetchLinkedInCampaignsByID,
  deleteLinkedInCampaignByID,
  editLinkedInCampaignByID,
} = require("../controllers/linkedin.controllers");

const routerLinkedIn = express.Router();

routerLinkedIn.post("/createLinkedInCampaign", createLinkedInCampaign);
routerLinkedIn.get("/fetchLinkedInCampaigns", fetchLinkedInCampaigns);
routerLinkedIn.get(
  "/fetchLinkedInCampaignsByID/:_id",
  fetchLinkedInCampaignsByID
);
routerLinkedIn.delete(
  "/deleteLinkedInCampaignByID/:_id",
  deleteLinkedInCampaignByID
);
routerLinkedIn.put("/editLinkedInCampaignByID/:_id", editLinkedInCampaignByID);

module.exports = routerLinkedIn;
