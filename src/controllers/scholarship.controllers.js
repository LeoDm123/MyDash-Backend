const Scholarships = require("../models/scholarship-model");

const createScholarship = async (req, res) => {
  try {
    const scholarshipData = req.body;

    const scholarship = new Scholarships(scholarshipData);

    await scholarship.save();

    res.status(201).json({
      msg: "Scholarship created successfully",
      scholarship,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "There was a problem creating the scholarship",
    });
  }
};

const getScholarships = async (req, res) => {
  try {
    const scholarships = await Scholarships.find();

    if (!scholarships || scholarships.length === 0) {
      return res.status(404).json({ message: "No scholarships found" });
    }

    res.status(200).json(scholarships);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "There was a problem fetching the scholarships",
    });
  }
};

const getScholarshipById = async (req, res) => {
  try {
    const { id } = req.params;

    const scholarship = await Scholarships.findById(id);

    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    res.status(200).json(scholarship);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "There was a problem fetching the scholarship",
    });
  }
};

const updateScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedScholarship = await Scholarships.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedScholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    res.status(200).json({
      msg: "Scholarship updated successfully",
      updatedScholarship,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "There was a problem updating the scholarship",
    });
  }
};

const deleteScholarship = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedScholarship = await Scholarships.findByIdAndDelete(id);

    if (!deletedScholarship) {
      return res.status(404).json({ message: "Scholarship not found" });
    }

    res.status(200).json({
      msg: "Scholarship deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "There was a problem deleting the scholarship",
    });
  }
};

module.exports = {
  createScholarship,
  getScholarships,
  getScholarshipById,
  updateScholarship,
  deleteScholarship,
};
