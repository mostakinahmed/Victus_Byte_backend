const SmsLog = require("../models/smsModel");

const getSmsLog = async (req, res) => {
  try {
    // Fetch all logs, sorted by the very latest first
    const logs = await SmsLog.find().sort({ createdAt: -1 });

    // We send a 200 status with the raw array
    res.status(200).json(logs);
  } catch (error) {
    console.error("Monitor Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch live logs",
    });
  }
};

module.exports = { getSmsLog };
