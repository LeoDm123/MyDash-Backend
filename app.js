const express = require("express");
const { dbConnection } = require("./src/database/config");
const app = express();
const cors = require("cors");

require("dotenv").config();

app.use(express.json());

app.use(cors());

app.use(function (req, res, next) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://leadspring.vercel.app/"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
});

dbConnection();

app.use("/auth", require("./src/routes/auth"));
app.use("/mails", require("./src/routes/mails"));
app.use("/linkedin", require("./src/routes/linkedin"));

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
});
