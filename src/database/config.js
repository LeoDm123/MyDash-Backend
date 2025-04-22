const mongoose = require("mongoose");

const dbConnection = async () => {
  console.log("🛠 Intentando conectar a MongoDB...");
  console.log(
    "🌍 DB_CNN:",
    process.env.DB_CNN ? "Cargada correctamente" : "No encontrada"
  );

  try {
    await mongoose.connect(process.env.DB_CNN, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    });

    // Verificar la conexión
    const db = mongoose.connection;

    db.on("error", (error) => {
      console.error("❌ Error en la conexión a MongoDB:", error);
    });

    db.on("disconnected", () => {
      console.warn("⚠️ MongoDB desconectado");
    });

    db.on("reconnected", () => {
      console.log("🔄 Reconectado a MongoDB");
    });

    // Verificar que podemos acceder a la base de datos
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📚 Colecciones disponibles:",
      collections.map((c) => c.name)
    );

    console.log("✅ Conectado a la base de datos");
  } catch (error) {
    console.error("❌ Problemas con la conexión a la base de datos:");
    console.error("Mensaje de error:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1); // Terminar la aplicación si no podemos conectar
  }
};

module.exports = { dbConnection };
