const { sign } = require("jsonwebtoken");
const Product = require("../models/productModel");
const multer = require("multer");

//get
const getAllProducts = async (req, res) => {
  try {
    const filter = {};

    // Check if category param exists
    if (req.query.category) {
      filter.category = req.query.category; // e.g. "C005"
    }

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Insert into MongoDB

// CREATE new Product
// const createProduct = async (req, res) => {
//   try {
//     const {
//       name,
//       brandName,
//       price,
//       stock,
//       category,
//       images,
//       description,
//       specifications,
//     } = req.body;

//     // Generate new pID
//     const lastProduct = await Product.findOne().sort({ createdAt: -1 });
//     let newNumber = 1;
//     if (lastProduct && lastProduct.pID) {
//       newNumber = parseInt(lastProduct.pID.slice(1)) + 1;
//     }
//     const newID = "P" + String(newNumber).padStart(6, "0");
//     const sID = "S" + String(newNumber).padStart(6, "0");

//     // Filter specifications
//     const filteredSpecs = {};
//     for (const key in specifications) {
//       const arr = specifications[key];
//       if (Array.isArray(arr) && arr.length > 0) {
//         filteredSpecs[key] = arr;
//       }
//     }

//     // Create new product
//     const newProduct = new Product({
//       pID: newID,
//       name,
//       brandName,
//       price,
//       stock: sID,
//       category,
//       images,
//       description,
//       specifications: filteredSpecs,
//     });

//     const savedProduct = await newProduct.save();
//     res.status(201).json({
//       pID: newID,
//       sID: sID,
//       message: "Product created successfully",
//     });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

const createProduct = async (req, res) => {
  try {
    const {
      name,
      brandName,
      price,
      category,
      images,
      description,
      specifications,
      keywords,
      colors,
    } = req.body;

    let newID,
      sID,
      isUnique = false;

    // --- 100% UNIQUE 6-DIGIT GENERATION LOOP ---
    while (!isUnique) {
      // 1. Get last 4 digits of timestamp (changes every millisecond)
      const ts4 = Date.now().toString().slice(-4);

      // 2. Generate 2 random digits (00 to 99)
      const rd2 = Math.floor(Math.random() * 90 + 10).toString();

      // 3. Combine them
      const unique6 = rd2 + ts4;

      newID = "P" + unique6;
      sID = "S" + unique6;

      // 4. Double check database to guarantee 100% uniqueness
      const existing = await Product.findOne({ pID: newID });
      if (!existing) {
        isUnique = true;
      }
    }

    // Filter specifications
    const filteredSpecs = {};
    if (specifications) {
      for (const key in specifications) {
        const arr = specifications[key];
        if (Array.isArray(arr)) {
          const validRows = arr.filter(
            (row) => row.key?.trim() && row.value?.trim(),
          );
          if (validRows.length > 0) {
            filteredSpecs[key] = validRows;
          }
        }
      }
    }

    // Create new product
    const newProduct = new Product({
      pID: newID,
      name,
      brandName,
      price,
      stock: sID,
      category,
      images: Array.isArray(images)
        ? images.filter((img) => img.trim() !== "")
        : [],
      description,
      keywords: Array.isArray(keywords) ? keywords : [],
      colors: Array.isArray(colors) ? colors : [],
      specifications: filteredSpecs,
    });

    await newProduct.save();

    res.status(201).json({
      pID: newID,
      sID: sID,
      message: "Product created successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//update stock
// PATCH /api/Product/:id/stock
const stockUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const updated = await Product.findOneAndUpdate(
      { pID: id },
      { stock: stock },
      { new: true },
    );

    if (!updated) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json(deletedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//update Product
// api/Product/update/:id
const productUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await Product.findOneAndUpdate({ _id: id }, data, {
      new: true,
    });

    if (!updated) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// statusUpdate
// statusUpdate
const statusUpdate = async (req, res) => {
  try {
    const { pID, key, value } = req.body;

    if (!pID || !key) {
      return res.status(400).json({ error: "pID and key are required." });
    }

    let updateField = "";

    if (typeof value === "boolean") {
      updateField = `status.${key}`;
    } else if (typeof value === "number") {
      updateField = `price.${key}`;
    } else {
      return res
        .status(400)
        .json({ error: "Value must be boolean or number." });
    }

    const updated = await Product.findOneAndUpdate(
      { pID },
      { $set: { [updateField]: value } },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  stockUpdate,
  deleteProduct,
  productUpdate,
  statusUpdate,
};
