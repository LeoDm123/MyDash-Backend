const { Schema, model } = require("mongoose");

const userSchema = Schema({
  userName: {
    type: String,
    required: true,
  },

  userEmail: {
    type: String,
    required: true,
    unique: true,
  },

  userPassword: {
    type: String,
    required: true,
  },

  rol: {
    type: String,
    default: "user",
  },
});

module.exports = model("Users", userSchema);
