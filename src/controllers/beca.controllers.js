const Becas = require("../models/beca-model");
const generarSitemap = require("../services/generarSitemap");
const slugify = require("slugify");

const crearBeca = async (req, res) => {
  try {
    const becaData = req.body;

    const beca = new Becas(becaData);

    await beca.save();

    await generarSitemap();

    res.status(201).json({
      msg: "Beca creada exitosamente",
      beca,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hubo un problema al crear la beca",
    });
  }
};

const getBecas = async (req, res) => {
  try {
    const beca = await Becas.find();

    if (!beca || beca.length === 0) {
      return res.status(404).json({ message: "No se encontrarón becas" });
    }

    res.status(200).json(beca);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hubo un problema al obtener las becas",
    });
  }
};

const getBecaById = async (req, res) => {
  try {
    const { id } = req.params;

    const beca = await Becas.findById(id);

    if (!beca) {
      return res.status(404).json({ message: "Beca no encontrada" });
    }

    const becaObj = beca.toObject();
    becaObj.slug = slugify(beca.nombreBeca || "", {
      lower: true,
      strict: true,
    });

    res.status(200).json(becaObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hubo un problema al obtener la beca",
    });
  }
};

const getBecasBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const becas = await Becas.find({}, { nombreBeca: 1, _id: 1 });

    const becasConSlug = becas.map((beca) => {
      const generatedSlug = slugify(beca.nombreBeca || "", {
        lower: true,
        strict: true,
      });
      return {
        _id: beca._id,
        nombreBeca: beca.nombreBeca,
        slug: generatedSlug,
      };
    });

    const becasFiltradas = becasConSlug.filter((b) => b.slug === slug);

    if (becasFiltradas.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron becas con ese slug" });
    }

    res.status(200).json(becasFiltradas);
  } catch (error) {
    console.error("Error al buscar becas por slug:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const updateBeca = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedBeca = await Becas.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedBeca) {
      return res.status(404).json({ message: "Beca no encontrada" });
    }

    res.status(200).json({
      msg: "Beca actualizada exitosamente",
      updatedBeca,
    });

    await generarSitemap();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hubo un problema al obtener las becas",
    });
  }
};

const deleteBeca = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBeca = await Becas.findByIdAndDelete(id);

    if (!deletedBeca) {
      return res.status(404).json({ message: "Beca no encontrada" });
    }

    res.status(200).json({
      msg: "Beca borrada exitosamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Hubo un problema al obtener las becas",
    });
  }
};

module.exports = {
  crearBeca,
  getBecas,
  getBecaById,
  updateBeca,
  deleteBeca,
  getBecasBySlug,
};
