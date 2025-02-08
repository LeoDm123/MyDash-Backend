const express = require("express");
const { dbConnection } = require("./src/database/config");
const app = express();
const cors = require("cors");

require("dotenv").config();

app.use(express.json());

app.use(cors());

dbConnection();

app.use("/auth", require("./src/routes/auth"));
app.use("/beca", require("./src/routes/beca"));
app.use("/parametros", require("./src/routes/parametros"));

app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en el puerto ${process.env.PORT}`);
});
