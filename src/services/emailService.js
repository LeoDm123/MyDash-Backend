const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendMail = async (email, token, type = "verify") => {
  let subject, html;

  if (type === "reset") {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
    subject = "Recuperación de contraseña de cuenta en TodoBeca.com";
    html = `
      <h2>Recuperá tu contraseña</h2>
      <p>Para cambiar tu contraseña, hacé clic en el siguiente enlace:</p>
      <a href="${resetUrl}">Restablecer contraseña</a>
      <p>Este enlace expirará en 30 minutos.</p>
    `;
  } else {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    subject = "Verificación de email en TodoBeca.com";
    html = `
      <h2>Verificá tu email</h2>
      <p>Para completar tu registro, hacé clic en el siguiente enlace:</p>
      <a href="${verifyUrl}">Verificar Email</a>
    `;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;
