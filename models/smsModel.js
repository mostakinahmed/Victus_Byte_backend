const mongoose = require("mongoose");

const smsLogSchema = new mongoose.Schema({
  // Message Details
  phoneNumber: { type: String, required: true, index: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["OTP", "ORDER", "RESET", "PROMO"] },

  // Exact Response from Gateway
  message_id: {
    type: String,
    index: true,
    unique: true,
    sparse: true,
  }, // e.g., 73300527
  response_code: { type: Number }, // e.g., 202
  success_message: { type: String }, // e.g., "SMS Submitted Successfully 1"
  error_message: { type: String }, // e.g., "" or error details

  // Timing
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SmsLog", smsLogSchema);
