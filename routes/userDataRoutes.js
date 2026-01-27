const express = require("express");
const {
  adminSignUp,
  adminSignIn,
  adminCheckAuth,
  adminList,
  adminUpdate,
} = require("../controllers/userDataController");

const multer = require("multer");
const upload = multer();
const router = express.Router();
const { authorize } = require("../middlewares/apiMiddleware.js");


// Admin routes can be added here in the future
router.post("/admin/signup", authorize(["45"]), adminSignUp);
router.post("/admin/signin", adminSignIn);
router.post("/admin/check-auth", adminCheckAuth);
router.get("/admin/list", authorize(["45", "15"]), adminList);
router.put("/admin/update/:id", authorize(["45"]), adminUpdate);

module.exports = router;
