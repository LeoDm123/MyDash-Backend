const crypto = require("crypto");
const { CashDataset } = require("../models/cashflow-model");

/*
 * NOTA PARA FUTUROS MODELOS ESPECÍFICOS: (idéntica a tu comentario original)
 * ...
 */

/**
 * ==========================
 *  Helpers de fecha (string)
 * ==========================
 */

/** Valida que la fecha sea un string DD/MM/YY o DD/MM/YYYY (no convierte a Date). */
function isFechaString(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return /^\d{2}\/\d{2}\/\d{2}(\d{2})?$/.test(s);
}

/** Clave auxiliar de ordenamiento (YYMMDD o YYYYMMDD). No altera el valor real. */
function toSortableKeyYY(fechaStr) {
  const s = String(fechaStr).trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{2}(\d{2})?)$/);
  if (!m) return s; // si no matchea, devolvemos tal cual (quedará al final)
  const dd = m[1];
  const mm = m[2];
  const yy = m[3]; // puede ser 2 o 4 dígitos; usamos lo que venga sin inferir siglo
  return `${yy.padStart(2, "0")}${mm}${dd}`;
}

/**
 * Acepta obj {grupo,subgrupo} o string "Grupo:Subgrupo"
 */
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
    // Por ahora solo usamos CashDataset
    const DatasetModel = CashDataset;

    // Normalizar movimientos SIN convertir fecha a Date
    const normalized = [];
    for (const [i, m] of movements.entries()) {
      const tipo = typeof m?.tipo === "string" ? m.tipo.trim() : "";
      if (tipo !== "ingreso" && tipo !== "egreso") {
        return res.status(400).json({
          msg: `Movimiento #${i + 1}: tipo inválido (ingreso|egreso)`,
        });
      }

      const fechaRaw = m?.fecha;
      if (!isFechaString(fechaRaw)) {
        return res.status(400).json({
          msg: `Movimiento #${i + 1}: fecha inválida (DD/MM/YY o DD/MM/YYYY)`,
        });
      }
      const fecha = String(fechaRaw).trim(); // <-- se guarda EXACTAMENTE como vino

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
        fecha, // <-- string intacto
        categoria,
        tipo,
        monto: Math.abs(montoNum),
        saldo,
        nota,
        source,
        externalId,
      });
    }

    // Periodo (ordenando strings por clave auxiliar YYMMDD/YYYMMDD)
    const fechasOrdenadas = normalized
      .map((x) => x.fecha)
      .sort((a, b) => toSortableKeyYY(a).localeCompare(toSortableKeyYY(b)));

    const periodStart = fechasOrdenadas[0] || undefined; // string
    const periodEnd = fechasOrdenadas[fechasOrdenadas.length - 1] || undefined; // string

    // (Opcional) Totales simples
    let ingresos = 0;
    let egresos = 0;
    for (const m of normalized) {
      if (m.tipo === "ingreso") ingresos += m.monto;
      else egresos += m.monto;
    }

    // Evitar duplicados por nombre (tu lógica original)
    const dup = await DatasetModel.findOne({ datasetName })
      .select("_id")
      .lean();
    if (dup) {
      return res.status(409).json({
        msg: "El dataset ya fue importado (checksum duplicado para este nombre).",
        datasetId: dup._id,
      });
    }

    // Guardar (asegurate que en el schema fecha/periodStart/periodEnd sean String)
    const doc = await DatasetModel.create({
      datasetName,
      originalFileName,
      importedBy,
      currency,
      datasetType,
      periodStart, // <-- string
      periodEnd, // <-- string
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

    // Por ahora solo CashDataset
    let datasets = [];

    if (datasetType) {
      datasets = await CashDataset.find({ datasetType }).sort({
        createdAt: -1,
      });
    } else {
      datasets = await CashDataset.find({}).sort({ createdAt: -1 });
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

    const dataset = await CashDataset.findById(id);

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

    const allDatasets = await CashDataset.find({}).sort({ createdAt: -1 });

    const groupedDatasets = {};
    for (const dataset of allDatasets) {
      const type = dataset.datasetType || "other";
      if (!groupedDatasets[type]) {
        groupedDatasets[type] = [];
      }
      groupedDatasets[type].push(dataset);
    }

    for (const [type, datasets] of Object.entries(groupedDatasets)) {
      const formattedDatasets = datasets.map((dataset) => ({
        _id: dataset._id,
        datasetName: dataset.datasetName,
        originalFileName: dataset.originalFileName,
        importedAt: dataset.importedAt,
        importedBy: dataset.importedBy,
        currency: dataset.currency,
        periodStart: dataset.periodStart, // string
        periodEnd: dataset.periodEnd, // string
        movementsCount: dataset.movements.length,
      }));

      folders.push({
        folderName: type,
        displayName: getDisplayName(type),
        count: datasets.length,
        datasets: formattedDatasets,
      });
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

const getDatasetsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const { datasetType } = req.query;

    if (!email) {
      return res.status(400).json({ msg: "Email es requerido" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Formato de email inválido" });
    }

    const filter = { importedBy: email };
    if (datasetType) {
      filter.datasetType = datasetType;
    }

    const datasets = await CashDataset.find(filter).sort({ createdAt: -1 });

    if (!datasets || datasets.length === 0) {
      return res.status(404).json({
        message: datasetType
          ? `No se encontraron datasets de tipo "${datasetType}" para el email: ${email}`
          : `No se encontraron datasets para el email: ${email}`,
      });
    }

    const formattedDatasets = datasets.map((dataset) => ({
      _id: dataset._id,
      datasetName: dataset.datasetName,
      originalFileName: dataset.originalFileName,
      importedAt: dataset.importedAt,
      importedBy: dataset.importedBy,
      datasetType: dataset.datasetType || "other",
      currency: dataset.currency,
      periodStart: dataset.periodStart, // string
      periodEnd: dataset.periodEnd, // string
      movements: dataset.movements,
    }));

    return res.status(200).json({
      message: "Datasets encontrados",
      email: email,
      datasetType: datasetType || "all",
      datasets: formattedDatasets,
      count: datasets.length,
    });
  } catch (error) {
    console.error("[getDatasetsByEmail] error:", error);
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

  if (!datasetId) {
    return res.status(400).json({ msg: "datasetId es requerido" });
  }

  if (!Array.isArray(movements) || movements.length === 0) {
    return res
      .status(400)
      .json({ msg: "movements debe ser un array con al menos 1 elemento" });
  }

  try {
    const dataset = await CashDataset.findById(datasetId);

    if (!dataset) {
      return res.status(404).json({ msg: "Dataset no encontrado" });
    }

    const datasetType = dataset.datasetType || "other";

    // Normalizar nuevos movimientos (fecha como string)
    const normalizedMovements = [];
    for (const [i, m] of movements.entries()) {
      const tipo = typeof m?.tipo === "string" ? m.tipo.trim() : "";
      if (tipo !== "ingreso" && tipo !== "egreso") {
        return res.status(400).json({
          msg: `Movimiento #${i + 1}: tipo inválido (ingreso|egreso)`,
        });
      }

      const fechaRaw = m?.fecha;
      if (!isFechaString(fechaRaw)) {
        return res.status(400).json({
          msg: `Movimiento #${i + 1}: fecha inválida (DD/MM/YY o DD/MM/YYYY)`,
        });
      }
      const fecha = String(fechaRaw).trim(); // <-- string

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

      normalizedMovements.push({
        fecha, // <-- string intacto
        categoria,
        tipo,
        monto: Math.abs(montoNum),
        saldo,
        nota,
        source,
        externalId,
      });
    }

    // Agregar y recalcular periodo (usando strings)
    dataset.movements.push(...normalizedMovements);

    const allFechas = dataset.movements
      .map((x) => x.fecha)
      .filter(Boolean)
      .sort((a, b) => toSortableKeyYY(a).localeCompare(toSortableKeyYY(b)));

    dataset.periodStart = allFechas[0] || dataset.periodStart;
    dataset.periodEnd = allFechas[allFechas.length - 1] || dataset.periodEnd;

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
  getDatasetsByEmail,
  addMovementsToDataset,
};
