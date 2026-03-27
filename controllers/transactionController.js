const Transaction = require("../models/TransactionModel");

const createTransaction = async (req, res) => {
  try {
    // 1. Destructure all fields from the body
    const { type, amount, title, reference } = req.body;

    // 2. Validation
    if (!type || !amount || !title) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, amount, or title",
      });
    }

    // 3. Create the instance
    const newTransaction = new Transaction({
      type, // "investment", "expense", or "purchase"
      amount: Number(amount),
      title,
      reference: reference || "N/A", // Use default if empty
      // FIX: Ensure date is defined from req.body or use the model's default
      date: Date.now(),
    });

    // 4. Save to MongoDB
    await newTransaction.save();

    res.status(201).json({
      success: true,
      message: "Transaction logged successfully",
      data: newTransaction,
    });
  } catch (error) {
    // This catches validation errors (like wrong enum type) or database connection issues
    console.error("Transaction Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: " + error.message,
    });
  }
};

// @desc    Get transactions with optional filtering
const getTransactions = async (req, res) => {
  try {
    const { type } = req.query; // e.g. /api/transactions?type=expense
    const filter = type ? { type } : {};

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    res
      .status(200)
      .json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTransactions, createTransaction };
