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

// router.get("/", getAllUser);
// router.post("/signup", signUp);
// router.post("/signin", signIn);
// router.post("/check-auth", checkAuth);

// Admin routes can be added here in the future
router.post("/admin/signup", adminSignUp);
router.post("/admin/signin", adminSignIn);
router.post("/admin/check-auth", adminCheckAuth);
router.get("/admin/list", adminList);
router.put("/admin/update/:id", adminUpdate);

module.exports = router;
