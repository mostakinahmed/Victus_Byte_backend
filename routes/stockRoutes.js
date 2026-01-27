const express = require("express");
const {
  getAllStock,
  createStock,
  addStock,
  getAllStockClient,
} = require("../controllers/stockController");

const multer = require("multer");
const upload = multer();
const router = express.Router();
const { authorize } = require("../middlewares/apiMiddleware.js");

router.get("/", authorize(["45", "15"]), getAllStock);
router.post("/create-stock", authorize(["45", "15"]), createStock);
router.post("/add-stock", authorize(["45", "15"]), addStock);

//public api
router.get("/client", getAllStockClient);
module.exports = router;
