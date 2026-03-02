const mongoose = require("mongoose");

const customerDataSchema = new mongoose.Schema(
  {
    cID: { type: String, required: true, unique: true },

    // Auth & Verification
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },

    // Core Identity
    phone: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    email: { type: String, required: true }, // Removed unique: true
    password: { type: String, required: true },

    // Profile Details
    images: {
      type: String,
      default:
        "https://7vgva7cju0vcfvwf.public.blob.vercel-storage.com/icons8-user-40.png",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
  },
  { timestamps: true },
);

// This makes it FAST and prevents DUPLICATES
customerDataSchema.index({ phone: 1 }, { unique: true });

module.exports = mongoose.model("customerData", customerDataSchema);
