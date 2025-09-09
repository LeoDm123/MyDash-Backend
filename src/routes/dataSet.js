const express = require("express");
const {
  createDataset,
  getDatasets,
  getDatasetById,
  getDatasetsByType,
  addMovementsToDataset,
} = require("../controllers/dataSet.controllers");
const authMiddleware = require("../services/auth-middleware");

const routerDataSet = express.Router();

routerDataSet.post("/createDataset", authMiddleware, createDataset);
routerDataSet.get("/getDatasets", authMiddleware, getDatasets);
routerDataSet.get("/getDatasetsByType", authMiddleware, getDatasetsByType);
routerDataSet.get("/getDatasetById/:id", authMiddleware, getDatasetById);
routerDataSet.put(
  "/addMovements/:datasetId",
  authMiddleware,
  addMovementsToDataset
);

module.exports = routerDataSet;
