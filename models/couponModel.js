const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    couponID: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },
    value: {
      type: Number,
      required: true,
    },
    minTK: {
      type: Number,
      required: true,
    },
    status: {
      type: Boolean,
      default: true, // true = Active, false = Deactive
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("coupon", couponSchema);
