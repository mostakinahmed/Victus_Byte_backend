const express = require("express");
const {
  createOrder,
  getAllOrder,
  orderUpdate,
  getSmsBalance,
} = require("../controllers/orderController");
const { authorize } = require("../middlewares/apiMiddleware.js");

const multer = require("multer");
const upload = multer(); // initialize multer
const router = express.Router();

router.get("/", authorize(["45", "15"]), getAllOrder);
router.post("/create-order", upload.none(), createOrder);
router.patch("/update/:orderId", authorize(["45", "15"]), orderUpdate);
router.get("/sms-balance", authorize(["45", "15"]), getSmsBalance);

module.exports = router;
