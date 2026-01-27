const express = require("express");
const {
  createProduct,
  getAllProducts,
  getAllProductsClient,
  statusUpdate,
} = require("../controllers/productController");
const { authorize } = require("../middlewares/apiMiddleware.js");

const multer = require("multer");
const upload = multer(); // initialize multer
const router = express.Router();

router.get("/", authorize(["45", "15"]), getAllProducts);
router.post("/", upload.none(), authorize(["45", "15"]), createProduct);
router.patch("/", authorize(["45", "15"]), statusUpdate);

//public route
router.get("/client", getAllProductsClient);

module.exports = router;
