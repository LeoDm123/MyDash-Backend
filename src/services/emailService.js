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

const sendMail = async (email, token, firstName, type = "verify") => {
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
    const verifyUrl = `${process.env.EMAIL_VERIFICATION_URL}?token=${token}`;
    subject = "Validá tu cuenta en TodoBeca.com! 🎓";
    html = `
      <h2>¡Hola ${firstName}! </h2>
      <p>Gracias por registrarte en TodoBeca.com, la plataforma que reúne todas las becas y oportunidades académicas para estudiantes latinoamericanos en un solo lugar.</p>
      <br>
      <h6>✈️ ¿Qué podés hacer?</h6>
      <p>Explorar becas por país, nivel de estudio, área de interés, idioma, tipo de financiamiento y mucho más.</p>
      <br>
      <h6>🌐 ¿Cómo sacarle el máximo provecho?</h6>
      <p>Completá tu perfil, lo que nos permite mostrarte las oportunidades que realmente se ajustan a vos y a lo que estás buscando. Además, vas a poder usar todos los filtros avanzados y funcionalidades que hacen mucho más fácil encontrar esa beca ideal.<strong> Cuanto más completo esté tu perfil, mejores serán las recomendaciones.</strong></p>
      <br>
      <p>Activá tu cuenta: <a href="${verifyUrl}">Hacé click aquí</a> para validar tu mail y empezar a usar TodoBeca.com</p>
      <br>
      <p>---</p>
      <br>
      <h6>El equipo de TodoBeca.com</h6>
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
