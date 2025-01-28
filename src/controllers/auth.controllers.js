const Users = require("../models/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const createUser = async (req, res) => {
  const { userEmail, userPassword, ...rest } = req.body;

  try {
    let user = await Users.findOne({ "login.email": userEmail });

    if (user) {
      return res.status(400).json({
        msg: "The user already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    user = new Users({
      login: {
        email: userEmail,
        password: hashedPassword,
      },
      ...rest,
    });

    await user.save();

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

    let user = await Users.findOne({ "login.email": userEmail }).exec();

    if (!user) {
      return res.status(401).json({
        msg: "The email or password are incorrect",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      userPassword,
      user.login.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        msg: "The email or password are incorrect",
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      msg: "User logged",
      token,
      user: {
        role: user.role,
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

    const user = await Users.findOne({ "login.email": userEmail });

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

const getUserById = async (req, res) => {
  try {
    const user = await Users.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userEmail, userPassword, ...rest } = req.body;

    let updateData = { ...rest };

    if (userPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userPassword, salt);
      updateData.login = { email: userEmail, password: hashedPassword };
    } else {
      updateData.login = { email: userEmail };
    }

    const updatedUser = await Users.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await Users.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
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
  getUserById,
  updateUser,
  deleteUser,
};
