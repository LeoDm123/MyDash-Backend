const Parametros = require("../models/parametros-model");

const getParametros = async (req, res) => {
  try {
    let parametros = await Parametros.findOne();

    if (!parametros) {
      return res.status(404).json({ msg: "No se encontraron parámetros" });
    }

    res.status(200).json(parametros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al obtener los parámetros" });
  }
};

const addIdioma = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ msg: "El nombre del idioma es requerido" });
    }

    let parametros = await Parametros.findOne();

    if (!parametros) {
      parametros = new Parametros({ idiomas: [nombre] });
    } else {
      if (parametros.idiomas.includes(nombre)) {
        return res.status(400).json({ msg: "El idioma ya existe" });
      }
      parametros.idiomas.push(nombre);
    }

    await parametros.save();

    return res
      .status(201)
      .json({ msg: "Idioma agregado correctamente", parametros });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al agregar el idioma" });
  }
};

const addMultiplesIdiomas = async (req, res) => {
  try {
    const { idiomas } = req.body;

    if (!idiomas || !Array.isArray(idiomas) || idiomas.length === 0) {
      return res.status(400).json({ msg: "Debe enviar una lista de idiomas" });
    }

    let parametros = await Parametros.findOne();

    if (!parametros) {
      parametros = new Parametros({ idiomas });
    } else {
      const nuevosIdiomas = idiomas.filter(
        (idioma) => !parametros.idiomas.includes(idioma)
      );
      parametros.idiomas.push(...nuevosIdiomas);
    }

    await parametros.save();

    return res
      .status(201)
      .json({ msg: "Idiomas agregados correctamente", parametros });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al agregar los idiomas" });
  }
};

const updateIdioma = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
      return res
        .status(400)
        .json({ msg: "Se requieren ambos nombres (antiguo y nuevo)" });
    }

    let parametros = await Parametros.findOne();

    if (!parametros || !parametros.idiomas.includes(oldName)) {
      return res.status(404).json({ msg: "El idioma no existe" });
    }

    parametros.idiomas = parametros.idiomas.map((idioma) =>
      idioma === oldName ? newName : idioma
    );

    await parametros.save();

    return res
      .status(200)
      .json({ msg: "Idioma actualizado correctamente", parametros });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al actualizar el idioma" });
  }
};

const deleteIdioma = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ msg: "El nombre del idioma es requerido" });
    }

    let parametros = await Parametros.findOne();

    if (!parametros || !parametros.idiomas.includes(nombre)) {
      return res.status(404).json({ msg: "El idioma no existe" });
    }

    parametros.idiomas = parametros.idiomas.filter(
      (idioma) => idioma !== nombre
    );

    await parametros.save();

    return res
      .status(200)
      .json({ msg: "Idioma eliminado correctamente", parametros });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al eliminar el idioma" });
  }
};

const addPais = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ msg: "El nombre del país es requerido" });
    }

    let parametros = await Parametros.findOne();

    if (!parametros) {
      parametros = new Parametros({ paises: [nombre] });
    } else {
      if (parametros.paises.includes(nombre)) {
        return res.status(400).json({ msg: "El país ya existe" });
      }
      parametros.paises.push(nombre);
    }

    await parametros.save();

    return res
      .status(201)
      .json({ msg: "País agregado correctamente", parametros });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al agregar el país" });
  }
};

const addMultiplesPaises = async (req, res) => {
  try {
    const { paises } = req.body;

    if (!paises || !Array.isArray(paises) || paises.length === 0) {
      return res.status(400).json({ msg: "Debe enviar una lista de países" });
    }

    let parametros = await Parametros.findOne();

    if (!parametros) {
      parametros = new Parametros({ paises });
    } else {
      const nuevosPaises = paises.filter(
        (pais) => !parametros.paises.includes(pais)
      );
      parametros.paises.push(...nuevosPaises);
    }

    await parametros.save();

    return res
      .status(201)
      .json({ msg: "Países agregados correctamente", parametros });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al agregar los países" });
  }
};

const updatePais = async (req, res) => {
  try {
    const { oldName, newName } = req.body;

    if (!oldName || !newName) {
      return res
        .status(400)
        .json({ msg: "Se requieren ambos nombres (antiguo y nuevo)" });
    }

    let parametros = await Parametros.findOne();

    if (!parametros || !parametros.paises.includes(oldName)) {
      return res.status(404).json({ msg: "El país no existe" });
    }

    parametros.paises = parametros.paises.map((pais) =>
      pais === oldName ? newName : pais
    );

    await parametros.save();

    return res
      .status(200)
      .json({ msg: "País actualizado correctamente", parametros });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al actualizar el país" });
  }
};

const deletePais = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ msg: "El nombre del país es requerido" });
    }

    let parametros = await Parametros.findOne();

    if (!parametros || !parametros.paises.includes(nombre)) {
      return res.status(404).json({ msg: "El país no existe" });
    }

    parametros.paises = parametros.paises.filter((pais) => pais !== nombre);

    await parametros.save();

    return res
      .status(200)
      .json({ msg: "País eliminado correctamente", parametros });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error al eliminar el país" });
  }
};

module.exports = {
  getParametros,
  addIdioma,
  addMultiplesIdiomas,
  updateIdioma,
  deleteIdioma,
  addPais,
  addMultiplesPaises,
  updatePais,
  deletePais,
};
