const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const slugify = require("slugify");
require("dotenv").config();

const BecaSchema = new mongoose.Schema({
  nombreBeca: String,
  updatedAt: Date,
});
const Beca = mongoose.model("Beca", BecaSchema);

async function generarSitemap() {
  console.log("🔍 Entrando en generarSitemap...");

  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(process.env.DB_CNN, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Conectado a MongoDB");

    console.log("📦 Buscando becas...");
    const becas = await Beca.find();

    if (!becas || becas.length === 0) {
      console.warn("⚠️ No se encontraron becas en la base de datos");
    } else {
      console.log(`📄 Se encontraron ${becas.length} becas`);
    }

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

    console.log("🧩 Generando sitemap...");
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
      "\n"
    )}\n</urlset>`;

    const outputPath = path.join(__dirname, "../public/sitemap.xml");

    console.log("📝 Escribiendo archivo en:", outputPath);
    fs.writeFileSync(outputPath, sitemap);
    console.log("✅ Sitemap generado correctamente");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error generando sitemap:", error.message);
    throw error;
  }
}

if (require.main === module) {
  generarSitemap()
    .then(() => console.log("✅ Finalizado correctamente."))
    .catch((err) => console.error("❌ Falló:", err.message));
}

module.exports = generarSitemap;
