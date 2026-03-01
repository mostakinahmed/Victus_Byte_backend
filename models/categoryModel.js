const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    catID: {
      type: String,
      required: [true, "Please enter category ID"],
      trim: true,
      unique: true,
      maxLength: [100, "Category ID cannot exceed 100 characters"],
    },

    catName: {
      type: String,
      required: [true, "Please enter category name"],
      trim: true,
      maxLength: [100, "Category name cannot exceed 100 characters"],
    },

    // --- NEW ICON FIELD ---
    catIcon: {
      type: String,
      required: [true, "Please select an icon for this category"],
      default: "FiBox", // Standard default icon
      trim: true,
    },

    topCategory: { 
      type: Boolean, 
      default: false 
    },
  },
  {
    timestamps: true, 
    versionKey: false, 
  }
);

module.exports = mongoose.model("Category", categorySchema);