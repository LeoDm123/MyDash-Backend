const { Schema, model } = require("mongoose");

const linkedInSchema = Schema({
  user: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  linkedInCampaignName: {
    type: String,
    required: true,
  },

  linkedInCampaignFilters: {
    type: Array,
    required: true,
  },

  linkedInCampaignSubjectAndMessage: {
    type: Array,
    required: true,
  },

  status: {
    type: String,
    default: "Pending",
    required: true,
  },
});

module.exports = model("LinkedInCampaigns", linkedInSchema);
