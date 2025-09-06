const crypto = require("crypto");
const { CashDataset } = require("../models/cashflow-model");

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
    fileChecksum,
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

  try {
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
    const totals = { ingresos, egresos, balance: ingresos - egresos };

    // Checksum opcional para idempotencia
    if (!fileChecksum) {
      fileChecksum = sha256({
        datasetName,
        originalFileName,
        currency,
        movements: normalized,
      });
    }

    // Evitar duplicados por (datasetName + fileChecksum)
    const dup = await CashDataset.findOne({ datasetName, fileChecksum })
      .select("_id")
      .lean();
    if (dup) {
      return res.status(409).json({
        msg: "El dataset ya fue importado (checksum duplicado para este nombre).",
        datasetId: dup._id,
      });
    }

    // Guardar
    const doc = await CashDataset.create({
      datasetName,
      originalFileName,
      importedBy,
      currency,
      fileChecksum,
      periodStart,
      periodEnd,
      totals,
      movements: normalized,
    });

    return res.status(201).json({
      msg: "Dataset creado",
      datasetId: doc._id,
      count: doc.movements.length,
      totals: doc.totals,
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
    const datasets = await CashDataset.find();

    if (!users) {
      return res.status(404).json({ message: "Datasets no encontrados" });
    }

    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getDatasetById = async (req, res) => {
  try {
    const datasets = await CashDataset.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = { createDataset, getDatasets, getDatasetById };
