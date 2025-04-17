const express = require("express");
const cors = require("cors");
const path = require("path");
const { dbConnection } = require("./src/database/config");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

dbConnection();

app.use("/auth", require("./src/routes/auth"));
app.use("/beca", require("./src/routes/beca"));
app.use("/parametros", require("./src/routes/parametros"));

app.use(express.static(path.join(__dirname, "public")));

const { sitemapHandler } = require("./src/controllers/auth.controllers");
app.get("/sitemap.xml", sitemapHandler);

app.listen(process.env.PORT, () => {
  console.log(`✅ Servidor corriendo en el puerto ${process.env.PORT}`);
});
