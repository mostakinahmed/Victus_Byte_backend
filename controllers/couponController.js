const Coupon = require("../models/couponModel");

// 1. CREATE: Add a new coupon (Admin)
const createCoupon = async (req, res) => {
  try {
    const { couponID, value, minTK, status } = req.body;

    const existing = await Coupon.findOne({ couponID: couponID.toUpperCase() });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon code already exists" });
    }

    const newCoupon = new Coupon({
      couponID: couponID.toUpperCase(),
      value,
      minTK,
      status: status !== undefined ? status : true, // Defaults to active
    });

    const savedCoupon = await newCoupon.save();
    res.status(201).json({ success: true, data: savedCoupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. READ: Get all coupons with full details (Admin Dashboard)
const getAllCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. READ: Get only ID and Value for active coupons (Storefront)
const getAllCouponClient = async (req, res) => {
  try {
    // -_id removes the MongoDB ID from the response for cleaner data
    const coupons = await Coupon.find({ status: true }).select(
      "couponID value minTK -_id",
    );

    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. UPDATE: Toggle Active/Deactive status (Admin)
// const toggleCouponStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const coupon = await Coupon.findById(id);

//     if (!coupon) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Coupon not found" });
//     }

//     coupon.status = !coupon.status;
//     await coupon.save();

//     res.status(200).json({
//       success: true,
//       message: `Coupon is now ${coupon.status ? "Active" : "Deactivated"}`,
//       status: coupon.status,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// Toggle Coupon Status (Active/Deactive)
const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the coupon first to get its current status
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // 2. Toggle the boolean value
    coupon.status = !coupon.status;

    // 3. Save the updated document
    await coupon.save();

    // 4. Send the response back to your React frontend
    res.status(200).json({
      success: true,
      message: `Coupon is now ${coupon.status ? "Active" : "Deactivated"}`,
      data: coupon, // Sending the whole object helps React update state easily
    });
  } catch (error) {
    console.error("Toggle Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while toggling status",
    });
  }
};

// 5. DELETE: Remove coupon by MongoDB ID (Admin)
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Coupon.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCoupon,
  getAllCoupon,
  getAllCouponClient,
  toggleCouponStatus,
  deleteCoupon,
};
