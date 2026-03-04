const express = require("express");
const {
  customerSignUp,
  customerSignIn,
  varifyOTP,
  customerList,
  customerUpdate,
  logout,
  getProfile,
  resetPassword,
  forgotPasswordSearch,
} = require("../controllers/customerDataController.js");
const { protect } = require("../middlewares/authMiddleware.js");

const router = express.Router();
// const { authorize } = require("../middlewares/apiMiddleware.js");

// Customer routes can be added here in the future
router.post("/signup", customerSignUp);
router.post("/signin", customerSignIn);
router.post("/logout", logout);

router.post("/varify-otp", varifyOTP); //common otp varify

router.get("/list", customerList);

router.post("/forgot-password-search", forgotPasswordSearch);
router.post("/reset-password", resetPassword);

router.get("/profile", protect, getProfile);

//update
router.post("/update", protect, customerUpdate);
// router.put("/update/:id", authorize(["45"]), customerUpdate);
module.exports = router;
