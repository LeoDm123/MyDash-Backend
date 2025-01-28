const express = require("express");
const router = express.Router();

const {
  createScholarship,
  getScholarships,
  getScholarshipById,
  updateScholarship,
  deleteScholarship,
} = require("../controllers/scholarship-controller");

routerScholarship.post("/createScholarship", createScholarship);
routerScholarship.get("/getScholarships", getScholarships);
routerScholarship.get("/getScholarshipById/:id", getScholarshipById);
routerScholarship.put("/updateScholarship/:id", updateScholarship);
routerScholarship.delete("/deleteScholarship/:id", deleteScholarship);

module.exports = router;
