const express = require("express");
const { dbConnection } = require("./src/database/config");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

dbConnection();

app.use("/auth", require("./src/routes/auth"));
app.use("/beca", require("./src/routes/beca"));
app.use("/parametros", require("./src/routes/parametros"));

const {
  generarSitemapController,
} = require("./src/controllers/auth.controllers");
app.get("/sitemap.xml", generarSitemapController);

app.listen(process.env.PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${process.env.PORT}`);
});
