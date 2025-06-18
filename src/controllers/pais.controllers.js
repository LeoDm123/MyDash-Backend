const Pais = require("../models/pais-model");
const slugify = require("slugify");

// Crear país
const crearPais = async (req, res) => {
  try {
    const paisData = req.body;

    const pais = new Pais(paisData);
    await pais.save();

    res.status(201).json({
      msg: "País creado exitosamente",
      pais,
    });
  } catch (error) {
    console.error("Error al crear país:", error);
    res.status(500).json({
      msg: "Hubo un problema al crear el país",
    });
  }
};

// Obtener todos los países
const getPaises = async (req, res) => {
  try {
    const paises = await Pais.find();

    if (!paises || paises.length === 0) {
      return res.status(404).json({ msg: "No se encontraron países" });
    }

    res.status(200).json(paises);
  } catch (error) {
    console.error("Error al obtener países:", error);
    res.status(500).json({
      msg: "Hubo un problema al obtener los países",
    });
  }
};

// Obtener país por nombre
const getPaisByNombre = async (req, res) => {
  try {
    const { nombre } = req.params;

    if (
      typeof nombre !== "string" ||
      nombre.trim().length < 2 ||
      nombre.trim().length > 100
    ) {
      return res.status(400).json({ msg: "Nombre de país inválido" });
    }

    const pais = await Pais.findOne({
      nombre: { $regex: new RegExp(nombre, "i") },
    });

    if (!pais) {
      return res.status(404).json({ msg: "País no encontrado" });
    }

    const paisObj = pais.toObject();
    paisObj.slug = slugify(pais.nombre || "", {
      lower: true,
      strict: true,
    });

    res.status(200).json(paisObj);
  } catch (error) {
    console.error("Error al obtener país por nombre:", error);
    res.status(500).json({
      msg: "Hubo un problema al obtener el país",
    });
  }
};

// Actualizar país
const updatePais = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedPais = await Pais.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedPais) {
      return res.status(404).json({ msg: "País no encontrado" });
    }

    res.status(200).json({
      msg: "País actualizado exitosamente",
      updatedPais,
    });
  } catch (error) {
    console.error("Error al actualizar país:", error);
    res.status(500).json({
      msg: "Hubo un problema al actualizar el país",
    });
  }
};

// Eliminar país
const deletePais = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPais = await Pais.findByIdAndDelete(id);

    if (!deletedPais) {
      return res.status(404).json({ msg: "País no encontrado" });
    }

    res.status(200).json({
      msg: "País eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar país:", error);
    res.status(500).json({
      msg: "Hubo un problema al eliminar el país",
    });
  }
};

module.exports = {
  crearPais,
  getPaises,
  getPaisByNombre,
  updatePais,
  deletePais,
};
