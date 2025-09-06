const express = require("express");
const {
  createDataset,
  getDatasets,
  getDatasetById,
} = require("../controllers/dataSet.controllers");
const authMiddleware = require("../services/auth-middleware");

const routerDataSet = express.Router();

routerDataSet.post("/createDataset", authMiddleware, createDataset);
routerDataSet.get("/getDatasets", authMiddleware, getDatasets);
routerDataSet.get("/getDatasetById/:id", authMiddleware, getDatasetById);

module.exports = routerDataSet;
