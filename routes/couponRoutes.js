const express = require("express");
const {
  createCoupon,
  getAllCouponClient,
  getAllCoupon,
  toggleCouponStatus, // <--- Make sure this is imported!
  deleteCoupon,
} = require("../controllers/couponController");
const { authorize } = require("../middlewares/apiMiddleware.js");

const router = express.Router();

// 1. PUBLIC: Storefront view
router.get("/", getAllCouponClient);

// 2. ADMIN: Full list for dashboard
router.get("/admin/all", getAllCoupon);

// 3. ADMIN: Create new
router.post("/create", createCoupon);

// 4. ADMIN: Toggle Active/Deactive (Use PATCH for updates)
router.post("/toggle/:id", toggleCouponStatus);

// 5. ADMIN: Delete
router.delete("/delete/:id", deleteCoupon);

module.exports = router;
