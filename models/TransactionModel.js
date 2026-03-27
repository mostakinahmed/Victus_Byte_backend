const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    // 1. The Category "Key"
    type: {
      type: String,
      required: true,
      enum: ["investment", "expense", "purchase"], // Only these 3 allowed
    },

    // 2. The Money
    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    // 3. Descriptive Data
    title: {
      type: String,
      required: true, // e.g., "Owner Investment", "Office Rent", "Samsung S24 Batch"
    },



    // 4. Logistics
    date: {
      type: Date,
      default: Date.now,
    },

    // 5. Advanced Fields (Optional)
    reference: {
      type: String, // Can store OrderID or ProductID if needed
      default: "N/A",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Transaction", TransactionSchema);
