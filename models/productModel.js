const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    pID: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brandName: { type: String },
    price: {
      cost: { type: Number, default: 0 },
      selling: { type: Number, required: true },
      discount: { type: Number, default: 0 },
    },
    stock: { type: String },
    category: { type: String },
    images: [{ type: String }],
    description: { type: String },

    // --- NEW FIELDS ADDED ---
    keywords: [{ type: String }], // For SEO and search accuracy
    colors: [{ type: String }], // For multiple color variants

    status: {
      isFeatured: { type: Boolean, default: false },
      isFlashSale: { type: Boolean, default: false },
      isBestSelling: { type: Boolean, default: false },
      isNewArrival: { type: Boolean, default: false },
    },

    // --- UPDATED SPECIFICATIONS ---
    // Using a Map allows you to use custom Section Names as keys
    specifications: {
      type: Map,
      of: [
        {
          key: { type: String, required: true },
          value: { type: String, required: true },
          _id: false,
        },
      ],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
