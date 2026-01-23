const express = require("express");
const {
  createOrder,
  getAllOrder,
  orderStatusChanged,
  orderUpdate,
  getSmsBalance,
} = require("../controllers/orderController");

const multer = require("multer");
const upload = multer(); // initialize multer
const router = express.Router();

router.get("/", getAllOrder);
router.post("/create-order", upload.none(), createOrder);
router.patch("/update/:orderId", orderUpdate);
router.patch("/status/:id", orderStatusChanged);
router.get("/sms-balance", getSmsBalance);

module.exports = router;
