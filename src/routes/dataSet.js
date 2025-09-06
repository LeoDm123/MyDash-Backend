const express = require("express");
const { createDataset } = require("../controllers/dataSet.controllers");
const authMiddleware = require("../services/auth-middleware");

const routerDataSet = express.Router();

routerDataSet.post("/createDataset", authMiddleware, createDataset);

module.exports = routerDataSet;
