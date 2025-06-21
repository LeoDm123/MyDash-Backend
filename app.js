const express = require("express");
const { dbConnection } = require("./src/database/config");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

const allowedOrigins = [
  "https://todobeca.com",
  "https://todobeca-admin.vercel.app",
  "http://localhost:4040",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use(helmet());

dbConnection();

app.use("/auth", require("./src/routes/auth"));
app.use("/beca", require("./src/routes/beca"));
app.use("/pais", require("./src/routes/pais"));
app.use("/parametros", require("./src/routes/parametros"));
app.use("/chat", require("./src/routes/chat"));

const {
  generarSitemapController,
} = require("./src/controllers/auth.controllers");
app.get("/sitemap.xml", generarSitemapController);

app.listen(process.env.PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${process.env.PORT}`);
});
