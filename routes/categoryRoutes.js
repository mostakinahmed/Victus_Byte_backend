const express = require("express");
const {
  createCategory,
  getAllCategories,
  deleteCategory,
  topCategories,
} = require("../controllers/categoryController");

const multer = require("multer");
const upload = multer(); // initialize multer
const router = express.Router();

router.get("/", getAllCategories);
router.post("/", upload.none(), createCategory);
router.delete("/delete/:id", deleteCategory);
router.patch("/", topCategories);
// router.get("/:id", getCategoryById);
// router.put("/:id", updateCategory);
// router.delete("/:id", deleteCategory);

module.exports = router;
