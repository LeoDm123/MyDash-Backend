const crypto = require("crypto");
const { datasetModels } = require("../models/cashflow-model");

// Valida fechas en ISO o dd/mm/yy(yy)
function parseFecha(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  const iso = new Date(value);
  if (!isNaN(iso.getTime())) return iso;

  const m = String(value)
    .trim()
    .match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    let yy = Number(m[3]);
    if (yy < 100) yy += 2000;
    return new Date(Date.UTC(yy, mm - 1, dd));
  }
  return null;
}

// Acepta obj {grupo,subgrupo} o string "Grupo:Subgrupo"
function normalizeCategoria(categoria) {
  if (!categoria) return { grupo: "SinClasificar", subgrupo: null };
  if (typeof categoria === "string") {
    const [grupo, ...rest] = categoria.split(":");
    const sub = rest.join(":") || null;
    return {
      grupo: (grupo || "SinClasificar").trim(),
      subgrupo: sub ? sub.trim() : null,
    };
  }
  const grupo = (categoria.grupo || "SinClasificar").trim();
  const sub = categoria.subgrupo ? String(categoria.subgrupo).trim() : null;
  return { grupo, subgrupo: sub || null };
}

function sha256(data) {
  const h = crypto.createHash("sha256");
  h.update(JSON.stringify(data));
  return h.digest("hex");
}

const createDataset = async (req, res) => {
  let {
    datasetName,
    originalFileName,
    importedBy,
    currency,
    datasetType,
    movements,
  } = req.body || {};

  // Validaciones sencillas
  if (typeof datasetName !== "string" || datasetName.trim().length < 2) {
    return res.status(400).json({ msg: "datasetName inválido" });
  }
  datasetName = datasetName.trim();

  if (!Array.isArray(movements) || movements.length === 0) {
    return res
      .status(400)
      .json({ msg: "movements debe ser un array con al menos 1 elemento" });
  }

  if (currency && typeof currency !== "string") {
    return res.status(400).json({ msg: "currency inválida" });
  }
  currency = (currency || "ARS").trim();

  // Validar datasetType
  const validDatasetTypes = [
    "cashflow",
    "inventory",
    "investment",
    "humanResources",
    "marketing",
    "sales",
    "other",
  ];

  if (datasetType && !validDatasetTypes.includes(datasetType)) {
    return res.status(400).json({
      msg: `datasetType inválido. Debe ser uno de: ${validDatasetTypes.join(
        ", "
      )}`,
    });
  }
  datasetType = datasetType || "other";

  try {
    // Obtener el modelo correcto según el tipo
    const DatasetModel = getDatasetModel(datasetType);

    // Normalizar movimientos
    const normalized = [];
    for (const [i, m] of movements.entries()) {
      const tipo = typeof m?.tipo === "string" ? m.tipo.trim() : "";
      if (tipo !== "ingreso" && tipo !== "egreso") {
        return res.status(400).json({
          msg: `Movimiento #${i + 1}: tipo inválido (ingreso|egreso)`,
        });
      }

      const fecha = parseFecha(m?.fecha);
      if (!fecha) {
        return res
          .status(400)
          .json({ msg: `Movimiento #${i + 1}: fecha inválida` });
      }

      const montoNum = Number(m?.monto);
      if (!montoNum || isNaN(montoNum) || montoNum <= 0) {
        return res
          .status(400)
          .json({ msg: `Movimiento #${i + 1}: monto inválido (debe ser > 0)` });
      }

      const categoria = normalizeCategoria(m?.categoria);
      const saldo = typeof m?.saldo === "number" ? m.saldo : undefined;
      const nota =
        m?.nota && String(m.nota).trim().length > 0
          ? String(m.nota).trim()
          : undefined;
      const source = m?.source || "csv";
      const externalId = m?.externalId || undefined;

      normalized.push({
        fecha,
        categoria,
        tipo,
        monto: Math.abs(montoNum),
        saldo,
        nota,
      });
    }

    // Periodo y totales simples (el schema también los calcula en pre-save)
    const fechas = normalized.map((x) => x.fecha).sort((a, b) => a - b);
    const periodStart = fechas[0];
    const periodEnd = fechas[fechas.length - 1];

    let ingresos = 0;
    let egresos = 0;
    for (const m of normalized) {
      if (m.tipo === "ingreso") ingresos += m.monto;
      else egresos += m.monto;
    }

    const dup = await DatasetModel.findOne({ datasetName })
      .select("_id")
      .lean();
    if (dup) {
      return res.status(409).json({
        msg: "El dataset ya fue importado (checksum duplicado para este nombre).",
        datasetId: dup._id,
      });
    }

    // Guardar
    const doc = await DatasetModel.create({
      datasetName,
      originalFileName,
      importedBy,
      currency,
      datasetType,
      periodStart,
      periodEnd,
      movements: normalized,
    });

    return res.status(201).json({
      msg: "Dataset creado",
      datasetId: doc._id,
      datasetType: doc.datasetType,
      period: { start: doc.periodStart, end: doc.periodEnd },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ msg: "Conflicto por clave única", key: err.keyValue });
    }
    console.error("[createDataset] error:", err);
    return res.status(500).json({ msg: "Error interno al crear el dataset" });
  }
};

const getDatasets = async (req, res) => {
  try {
    const { datasetType } = req.query;

    let datasets = [];

    if (datasetType) {
      // Buscar en un modelo específico
      const DatasetModel = getDatasetModel(datasetType);
      datasets = await DatasetModel.find({}).sort({ createdAt: -1 });
    } else {
      // Buscar en todos los modelos
      const allModels = getAllDatasetModels();
      const allDatasets = await Promise.all(
        allModels.map((model) => model.find({}).sort({ createdAt: -1 }))
      );
      datasets = allDatasets.flat();
    }

    if (!datasets || datasets.length === 0) {
      return res.status(404).json({
        message: datasetType
          ? `No se encontraron datasets de tipo: ${datasetType}`
          : "Datasets no encontrados",
      });
    }

    return res.status(200).json({
      datasets,
      count: datasets.length,
      datasetType: datasetType || "all",
    });
  } catch (error) {
    console.error("[getDatasets] error:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getDatasetById = async (req, res) => {
  try {
    const { id } = req.params;
    let dataset = null;

    // Buscar en todos los modelos
    const allModels = getAllDatasetModels();
    for (const model of allModels) {
      dataset = await model.findById(id);
      if (dataset) break;
    }

    if (!dataset) {
      return res.status(404).json({ message: "Dataset no encontrado" });
    }

    return res.status(200).json(dataset);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getDatasetsByType = async (req, res) => {
  try {
    const folders = [];

    // Obtener datasets de cada modelo
    for (const [type, model] of Object.entries(datasetModels)) {
      const datasets = await model.find({}).sort({ createdAt: -1 });

      if (datasets.length > 0) {
        const formattedDatasets = datasets.map((dataset) => ({
          _id: dataset._id,
          datasetName: dataset.datasetName,
          originalFileName: dataset.originalFileName,
          importedAt: dataset.importedAt,
          importedBy: dataset.importedBy,
          currency: dataset.currency,
          periodStart: dataset.periodStart,
          periodEnd: dataset.periodEnd,
          movementsCount: dataset.movements.length,
        }));

        folders.push({
          folderName: type,
          displayName: getDisplayName(type),
          count: datasets.length,
          datasets: formattedDatasets,
        });
      }
    }

    return res.status(200).json({
      message: "Datasets organizados por tipo",
      folders,
      totalFolders: folders.length,
      totalDatasets: folders.reduce((sum, folder) => sum + folder.count, 0),
    });
  } catch (error) {
    console.error("[getDatasetsByType] error:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Función auxiliar para obtener nombres más amigables
function getDisplayName(datasetType) {
  const displayNames = {
    cashflow: "Flujo de Caja",
    inventory: "Inventario",
    investment: "Inversiones",
    humanResources: "Recursos Humanos",
    marketing: "Marketing",
    sales: "Ventas",
    other: "Otros",
  };
  return displayNames[datasetType] || "Otros";
}

const addMovementsToDataset = async (req, res) => {
  const { datasetId } = req.params;
  const { movements } = req.body || {};

  // Validaciones básicas
  if (!datasetId) {
    return res.status(400).json({ msg: "datasetId es requerido" });
  }

  if (!Array.isArray(movements) || movements.length === 0) {
    return res
      .status(400)
      .json({ msg: "movements debe ser un array con al menos 1 elemento" });
  }

  try {
    // Buscar el dataset existente en todos los modelos
    const allModels = getAllDatasetModels();
    let dataset = null;
    let datasetType = null;

    for (const model of allModels) {
      dataset = await model.findById(datasetId);
      if (dataset) {
        // Determinar el tipo basado en el modelo
        const modelName = model.modelName;
        datasetType = Object.keys(datasetModels).find(
          (type) => datasetModels[type].modelName === modelName
        );
        break;
      }
    }

    if (!dataset) {
      return res.status(404).json({ msg: "Dataset no encontrado" });
    }

    // Normalizar los nuevos movimientos usando la misma lógica que createDataset
    const normalizedMovements = [];
    for (const [i, m] of movements.entries()) {
      const tipo = typeof m?.tipo === "string" ? m.tipo.trim() : "";
      if (tipo !== "ingreso" && tipo !== "egreso") {
        return res.status(400).json({
          msg: `Movimiento #${i + 1}: tipo inválido (ingreso|egreso)`,
        });
      }

      const fecha = parseFecha(m?.fecha);
      if (!fecha) {
        return res
          .status(400)
          .json({ msg: `Movimiento #${i + 1}: fecha inválida` });
      }

      const montoNum = Number(m?.monto);
      if (!montoNum || isNaN(montoNum) || montoNum <= 0) {
        return res
          .status(400)
          .json({ msg: `Movimiento #${i + 1}: monto inválido (debe ser > 0)` });
      }

      const categoria = normalizeCategoria(m?.categoria);
      const saldo = typeof m?.saldo === "number" ? m.saldo : undefined;
      const nota =
        m?.nota && String(m.nota).trim().length > 0
          ? String(m.nota).trim()
          : undefined;

      normalizedMovements.push({
        fecha,
        categoria,
        tipo,
        monto: Math.abs(montoNum),
        saldo,
        nota,
      });
    }

    // Agregar los nuevos movimientos al array existente
    dataset.movements.push(...normalizedMovements);

    // Recalcular fechas del período
    const allFechas = dataset.movements
      .map((x) => x.fecha)
      .sort((a, b) => a - b);
    dataset.periodStart = allFechas[0];
    dataset.periodEnd = allFechas[allFechas.length - 1];

    // Guardar el dataset actualizado
    await dataset.save();

    return res.status(200).json({
      msg: "Movimientos agregados exitosamente",
      datasetId: dataset._id,
      datasetType: datasetType,
      movementsAdded: normalizedMovements.length,
      totalMovements: dataset.movements.length,
      period: { start: dataset.periodStart, end: dataset.periodEnd },
    });
  } catch (error) {
    console.error("[addMovementsToDataset] error:", error);
    return res
      .status(500)
      .json({ msg: "Error interno al agregar movimientos" });
  }
};

module.exports = {
  createDataset,
  getDatasets,
  getDatasetById,
  getDatasetsByType,
  addMovementsToDataset,
};
