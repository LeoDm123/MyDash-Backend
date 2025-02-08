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

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.EMAIL_VERIFICATION_URL}?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verificación de cuenta en TodoBeca.com",
    html: `<h2>Verifica tu cuenta</h2>
           <p>Gracias por registrarte en TodoBeca.com. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
           <a href="${verificationUrl}">Verificar Email</a>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;
