const Users = require("../models/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const createUser = async (req, res) => {
  const { userName, userEmail, userPassword } = req.body;

  try {
    let user = await Users.findOne({ userEmail });

    if (user) {
      return res.status(400).json({
        msg: "The user already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    user = new Users({
      userName,
      userEmail,
      userPassword: hashedPassword,
    });

    await user.save();

    const payload = {
      
    }

    res.status(201).json({
      msg: "User registered",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "There was a problem registering the user",
    });
  }
};

const userLogin = async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;

    let user = await Users.findOne({ userEmail }).exec();

    if (!user) {
      return res.status(401).json({
        msg: "The email or password are incorrect",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      userPassword,
      user.userPassword
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        msg: "The email or password are incorrect",
      });
    }

    // Devolver el rol del usuario en la respuesta
    res.status(200).json({
      msg: "User logged",
      user: {
        role: user.rol,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "There was a problem logging in the user",
    });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const { userEmail } = req.query;

    const user = await Users.findOne({ userEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await Users.find();

    if (!users) {
      return res.status(404).json({ message: "User data not found" });
    }

    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createUser,
  userLogin,
  getUserByEmail,
  getUsers,
};
