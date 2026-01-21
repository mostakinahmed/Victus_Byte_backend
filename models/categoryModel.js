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
    topCategory: { type: Boolean, default: false },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt fields
    versionKey: false, // hides __v field
  },
);

module.exports = mongoose.model("Category", categorySchema);
