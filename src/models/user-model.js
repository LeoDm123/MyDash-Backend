const { Schema, model } = require("mongoose");

const userSchema = Schema({
  login: {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  personalData: {
    firstName: { type: String, required: true },
    middleName: { type: String, required: false },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, required: false },
    phone: { type: String, required: false },
    nationality: { type: String, required: true },
    additionalCitizenship: { type: [String], required: false },
    currentCity: { type: String, required: true },
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
  academicData: {
    highSchool: {
      institution: { type: String, required: false },
      country: { type: String, required: false },
      gpa: { type: Number, required: false },
    },
    undergraduate: {
      institution: { type: String, required: false },
      country: { type: String, required: false },
      gpa: { type: Number, required: false },
      completed: { type: Boolean, required: false },
    },
    postgraduate: {
      institution: { type: String, required: false },
      country: { type: String, required: false },
      gpa: { type: Number, required: false },
      completed: { type: Boolean, required: false },
    },
    researchExperience: { type: String, required: false },
    teachingExperience: { type: String, required: false },
  },
  workData: {
    jobExperience: { type: String, required: false },
  },
  hobbies: { type: [String], required: false },
  languages: [
    {
      language: { type: String, required: true },
      level: { type: String, required: true },
    },
  ],
  socialMedia: {
    linkedin: { type: String, required: false },
    instagram: { type: String, required: false },
    twitter: { type: String, required: false },
  },
  scholarshipProfile: {
    areasOfInterest: { type: [String], required: true },
    regionsOfInterest: { type: [String], required: true },
    countriesOfInterest: { type: [String], required: true },
    scholarshipTypes: { type: [String], required: true },
    startDate: { type: Date, required: true },
    economicVulnerability: { type: Boolean, required: true },
    researchTopics: { type: [String], required: true },
  },
  role: {
    type: String,
    default: "user",
  },
});

module.exports = model("User", userSchema);
