const { Schema, model } = require("mongoose");

const userSchema = Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, required: false },
  resetToken: { type: String, required: false },
  personalData: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: false },
    gender: { type: String, required: false },
    paisCode: { type: String, required: false },
    phone: { type: String, required: false },
    nationality: { type: String, required: false },
    additionalCitizenship: { type: [String], required: false },
    currentCity: { type: String, required: false },
    minorityGroups: {
      type: [String],
      enum: [
        "Católico",
        "Judío",
        "LGBT",
        "Afrodescendiente",
        "Migrante y/o Refugiado",
      ],
      required: false,
    },
  },
  academicData: [
    {
      institution: { type: String, required: false },
      degree: { type: String, required: false },
      discipline: { type: String, required: false },
      startMonth: { type: Number, required: false },
      startYear: { type: Number, required: false },
      endMonth: { type: Number, required: false },
      endYear: { type: Number, required: false },
    },
  ],
  workData: {
    jobExperience: { type: String, required: false },
  },
  hobbies: { type: [String], required: false },
  languages: [
    {
      language: { type: String, required: false },
      level: { type: String, required: false },
    },
  ],
  socialMedia: {
    linkedin: { type: String, required: false },
    instagram: { type: String, required: false },
    twitter: { type: String, required: false },
  },
  scholarshipProfile: {
    areasOfInterest: { type: [String], required: false },
    regionsOfInterest: { type: [String], required: false },
    countriesOfInterest: { type: [String], required: false },
    scholarshipTypes: { type: [String], required: false },
    startDate: { type: Date, required: false },
    economicVulnerability: { type: Boolean, required: false },
    researchTopics: { type: [String], required: false },
  },
  role: {
    type: String,
    default: "user",
  },
});

module.exports = model("User", userSchema);
