const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const slugify = require("slugify");
require("dotenv").config();

const BecaSchema = new mongoose.Schema({
  nombreBeca: String,
  updatedAt: Date,
});
const Beca = mongoose.models.Beca || mongoose.model("Beca", BecaSchema);

async function generarSitemap() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.DB_CNN, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    const becas = await Beca.find();

    const urls = becas.map((beca) => {
      const slug = slugify(beca.nombreBeca, { lower: true, strict: true });
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

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
      "\n"
    )}\n</urlset>`;

    const outputPath = path.join(__dirname, "../public/sitemap.xml");
    fs.writeFileSync(outputPath, sitemap);
    console.log("✅ sitemap.xml generado en:", outputPath);
  } catch (error) {
    console.error("❌ Error al generar el sitemap:", error);
    throw error;
  }
}

module.exports = generarSitemap;
