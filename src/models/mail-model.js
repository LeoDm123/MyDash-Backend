const { Schema, model } = require("mongoose");

const mailSchema = Schema({
  user: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  mailCampaignName: {
    type: String,
    required: true,
  },

  mailCampaignFilters: {
    type: Array,
    required: true,
  },

  mailCampaignSubjectAndMessage: {
    type: Array,
    required: true,
  },

  mailCampaignOptions: {
    type: Array,
    required: true,
  },

  status: {
    type: String,
    default: "Pending",
    required: true,
  },
});

module.exports = model("MailsCampaigns", mailSchema);
