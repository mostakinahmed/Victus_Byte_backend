const express = require("express");
const {
  createOrder,
  getAllOrder,
  orderUpdate,
  getSmsBalance,
  editOrder,
  createOrderClient,
} = require("../controllers/orderController");
const { authorize } = require("../middlewares/apiMiddleware.js");

const multer = require("multer");
const upload = multer(); // initialize multer
const router = express.Router();

router.get("/", authorize(["45", "15"]), getAllOrder);
router.post("/create-order", upload.none(), createOrder);
router.post("/create-order/client", upload.none(), createOrderClient);
router.patch("/update/:orderId", authorize(["45", "15"]), orderUpdate);
router.post("/edit-order/:orderId", authorize(["45", "15"]), editOrder);
router.get("/sms-balance", authorize(["45", "15"]), getSmsBalance);

module.exports = router;
