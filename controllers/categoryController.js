const category = require("../models/categoryModel");
const multer = require("multer");

const getAllCategories = async (req, res) => {
  try {
    const filter = {};

    // If query param exists, filter by catID
    if (req.query.catID) {
      filter.catID = req.query.catID; // e.g., "C001"
    }

    const categories = await category.find(filter);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE new category
const createCategory = async (req, res) => {
  try {
    // Validate required fields
    const { catID, catName } = req.body;

    if (!catID || !catName) {
      return res.status(400).json({
        success: false,
        message: "catID and catName are required.",
      });
    }

    // Check for duplicate category ID
    const existingCategory = await category.findOne({ catID });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: `Category with ID '${catID}' already exists.`,
      });
    }

    // Create and save new category
    const newCategory = new category({
      catID,
      catName,
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: savedCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating category.",
      error: error.message,
    });
  }
};

//Delete Category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCat = await category.findByIdAndDelete(id);

    if (!deletedCat)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json(deletedCat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//for top categories
const topCategories = async (req, res) => {
  try {
    const { catID, action } = req.body;

    const updated = await category.findOneAndUpdate(
      { catID: catID }, // match catID
      { $set: { topCategory: action } }, // field must match schema
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ error: "Category not found." });
    }

    return res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: "Server error." });
  }
};

// public api for client

const getAllCategoriesClient = async (req, res) => {
  try {
    const filter = {};

    // If query param exists, filter by catID
    if (req.query.catID) {
      filter.catID = req.query.catID; // e.g., "C001"
    }

    const categories = await category.find(filter);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  getAllCategoriesClient,
  deleteCategory,
  topCategories,
};
