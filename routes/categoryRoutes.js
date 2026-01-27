const express = require("express");
const {
  createCategory,
  getAllCategories,
  deleteCategory,
  getAllCategoriesClient,
  topCategories,
} = require("../controllers/categoryController");
const { authorize } = require("../middlewares/apiMiddleware.js");

const multer = require("multer");
const upload = multer(); // initialize multer
const router = express.Router();

router.get("/", authorize(["45", "15"]), getAllCategories);
router.post("/", upload.none(), authorize(["45"]), createCategory);
router.delete("/delete/:id", deleteCategory);
router.patch("/", authorize(["45", "15"]), topCategories);

//public route
router.get("/client", getAllCategoriesClient);

module.exports = router;
