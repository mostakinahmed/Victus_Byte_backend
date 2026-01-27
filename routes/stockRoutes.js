const express = require("express");
const {
  getAllStock,
  createStock,
  addStock,
} = require("../controllers/stockController");

const multer = require("multer");
const upload = multer();
const router = express.Router();
const { authorize } = require("../middlewares/apiMiddleware.js");

router.get("/", authorize(["45", "15"]), getAllStock);
router.post("/create-stock", authorize(["45", "15"]), createStock);
router.post("/add-stock", authorize(["45", "15"]), addStock);

module.exports = router;
