const Users = require("../models/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendMail = require("../services/emailService");
const generarSitemap = require("../services/generarSitemap");

const createUser = async (req, res) => {
  const { email, password, firstName, lastName, ...rest } = req.body;

  try {
    let user = await Users.findOne({ email });

    if (user) {
      return res.status(400).json({
        msg: "El usuario ya se encuentra registrado",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    user = new Users({
      email,
      password: hashedPassword,
      personalData: { firstName, lastName },
      verificationToken,
      emailVerified: false,
      ...rest,
    });

    await user.save();

    await sendMail(email, verificationToken);

    res.status(201).json({
      msg: "Usuario registrado. Verifica tu email antes de iniciar sesión.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Hubo un problema al registrar el usuario",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ msg: "Token no proporcionado" });
    }

    const user = await Users.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ msg: "Token inválido o expirado." });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send(`
  <html>
    <head>
      <script>
        setTimeout(function() {
          window.location.href = "${process.env.FRONTEND_URL}";
        }, 3000);
      </script>
    </head>
    <body>
      <h2>✅ ¡Email verificado con éxito!</h2>
      <p>Redirigiéndote a la página principal...</p>
    </body>
  </html>
`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al verificar el email." });
  }
};

const userLogin = async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;

    let user = await Users.findOne({ email: userEmail });

    if (!user) {
      return res.status(401).json({
        msg: "El email o la contraseña son incorrectos.",
      });
    }

    if (!user.emailVerified) {
      return res.status(402).json({
        msg: "Debes verificar tu email antes de iniciar sesión.",
      });
    }

    const isPasswordValid = await bcrypt.compare(userPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        msg: "El email o la contraseña son incorrectos.",
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      msg: "Usuario autenticado.",
      token,
      user: {
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Hubo un problema al iniciar sesión.",
    });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const { userEmail } = req.query;

    const user = await Users.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await Users.find();

    if (!users) {
      return res.status(404).json({ message: "Usuarios no encontrados" });
    }

    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await Users.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userEmail, userPassword, ...rest } = req.body;

    let updateData = { ...rest };

    if (userPassword) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userPassword, salt);
      updateData.password = hashedPassword;
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
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await Users.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({ message: "Usuario eliminado con éxito" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const sendPasswordResetEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiration = Date.now() + 1800000;

    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;
    await user.save();

    await sendMail(email, resetToken, "reset");

    res.status(200).json({
      msg: "Email de recuperación de contraseña enviado",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al enviar el email de recuperación" });
  }
};

const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ msg: "El email ya está verificado" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    await sendMail(email, verificationToken, "verify");

    res.status(200).json({
      msg: "Email de verificación enviado",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al enviar el email de verificación" });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await Users.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: "Token inválido o expirado" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ msg: "Contraseña actualizada con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al restablecer la contraseña" });
  }
};

const generarSitemapController = async (req, res) => {
  try {
    console.log("🔍 Generando sitemap para respuesta directa....");

    await mongoose.connect(process.env.DB_CNN);

    const becas = await Beca.find();

    const urls = becas.map((beca) => {
      const slug = slugify(beca.nombreBeca || "", {
        lower: true,
        strict: true,
      });
      const fecha = new Date(beca.updatedAt || new Date())
        .toISOString()
        .split("T")[0];

      return `
  <url>
    <loc>https://todobeca.com/becas/${slug}</loc>
    <lastmod>${fecha}</lastmod>
    <priority>0.9</priority>
  </url>`;
    });

    const sitemap =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.join("\n") +
      `\n</urlset>`;

    res.set("Content-Type", "application/xml");
    return res.status(200).send(sitemap);
  } catch (error) {
    console.error("❌ Error generando sitemap:", error.message);
    res.status(500).json({ message: "Error al generar sitemap" });
  } finally {
    mongoose.connection.readyState === 1 && mongoose.disconnect();
  }
};

module.exports = {
  createUser,
  verifyEmail,
  userLogin,
  getUserByEmail,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  sendPasswordResetEmail,
  sendVerificationEmail,
  resetPassword,
  generarSitemapController,
};
