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
  customerPassowrdChanged,
  myOrder,
} = require("../controllers/customerDataController.js");
const { protect } = require("../middlewares/authMiddleware.js");
const { authorize } = require("../middlewares/apiMiddleware.js");

const router = express.Router();

// Customer routes can be added here in the future
router.post("/signup", customerSignUp);
router.post("/signin", customerSignIn);
router.post("/logout", logout);

router.post("/varify-otp", varifyOTP); //common otp varify

router.post("/forgot-password-search", forgotPasswordSearch);
router.post("/reset-password", resetPassword);

router.get("/profile", protect, getProfile);

//update
router.post("/update", protect, customerUpdate);
router.post("/change-password", protect, customerPassowrdChanged);
router.get("/my-orders", protect, myOrder);
router.get("/order-status", myOrder);
// router.put("/update/:id", authorize(["45"]), customerUpdate);

//admin route
router.get("/list", authorize(["45", "15"]), customerList);

module.exports = router;
