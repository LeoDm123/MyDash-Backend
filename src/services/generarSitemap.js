const Becas = require("../models/beca-model");
const mongoose = require("mongoose");
const slugify = require("slugify");
require("dotenv").config();

async function generarSitemap({ withDb = false } = {}) {
  console.log("🔍 Generando sitemap...");

  try {
    if (withDb) {
      console.log("🔌 Conectando a MongoDB...");
      await mongoose.connect(process.env.DB_CNN);
      console.log("✅ Conectado a MongoDB");
    }

    console.log("📦 Buscando becas...");
    const becas = await Becas.find();

    if (!becas.length) {
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

    const sitemap =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.join("\n") +
      `\n</urlset>`;

    console.log("✅ Sitemap generado correctamente");

    if (withDb) {
      await mongoose.disconnect();
      console.log("🔌 Desconectado de MongoDB");
    }

    return sitemap;
  } catch (error) {
    console.error("❌ Error generando sitemap:", error.message);
    if (withDb) await mongoose.disconnect();
    throw error;
  }
}

// Si se ejecuta directamente con `node generarSitemap.js`
if (require.main === module) {
  generarSitemap({ withDb: true })
    .then((sitemap) => {
      console.log("✅ Finalizado correctamente.");
      console.log(sitemap);
    })
    .catch((err) => {
      console.error("❌ Falló:", err.message);
    });
}

module.exports = generarSitemap;
