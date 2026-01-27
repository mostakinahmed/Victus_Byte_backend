const stock = require("../models/stockModel");
const multer = require("multer");

const getAllStock = async (req, res) => {
  try {
    const stocks = await stock.find();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE new stock when i create a new product
const createStock = async (req, res) => {
  try {
    const { sID, pID } = req.body;

    if (!sID || !pID) {
      return res.status(400).json({ message: "sID and pID are required" });
    }

    // Check if stock already exists for product
    const existingStock = await stock.findOne({ pID });
    if (existingStock) {
      return res.status(400).json({
        message: "Stock already exists for this product",
        data: existingStock,
      });
    }

    const newStock = new stock({ sID, pID, SKU: [] });
    const savedStock = await newStock.save();

    res.status(201).json({
      success: true,
      message: "Stock created successfully",
      data: savedStock,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Add New Stock in a existing product
const addStock = async (req, res) => {
  try {
    const { pID, skuID, OID, comment, status } = req.body;

    if (!pID || !skuID) {
      return res.status(400).json({ message: "pID and skuId are required" });
    }

    // Find stock by product ID
    const currentStock = await stock.findOne({ pID });
    if (!currentStock) {
      return res
        .status(404)
        .json({ message: "Stock not found for this product" });
    }

    // Check if SKU already exists in the stock
    if (currentStock.SKU.some((sku) => sku.skuID === skuID)) {
      return res.status(400).json({
        message: "SKU already exists in stock",
        stock: currentStock,
      });
    }

    // Add new SKU to the array
    currentStock.SKU.push({ skuID, OID, comment, status });
    await currentStock.save();

    res.status(200).json({
      message: "SKU added successfully",
      stock: currentStock,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getAllStock, createStock, addStock };
