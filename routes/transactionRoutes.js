const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getTransactions,
} = require("../controllers/transactionController");

// Unified routes
router.post("/add", createTransaction);
router.get("/", getTransactions);

module.exports = router;
