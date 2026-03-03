const jwt = require("jsonwebtoken");
const Customer = require("../models/customerDataModel");

const protect = async (req, res, next) => {
  try {
    // 1. BLOCK DIRECT ACCESS (Address bar navigation)
    // 'sec-fetch-mode' is 'navigate' when someone pastes the URL in a tab
    if (req.headers["sec-fetch-mode"] === "navigate") {
      return res.status(403).json({
        success: false,
        message: "Direct API access is forbidden.",
      });
    }

    // 2. ORIGIN VALIDATION
    // Ensure the request is actually coming from one of your allowed domains
    const allowedOrigins = [
      "https://victusbyte.com",
      "https://www.victusbyte.com",
      "https://admin.victusbyte.com",
      "https://victusbyte.vercel.app",
      "http://localhost:5173",
    ];
    const origin = req.headers.origin || req.headers.referer;

    if (!origin || !allowedOrigins.some((o) => origin.startsWith(o))) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Unauthorized request source.",
      });
    }

    // 3. TOKEN CHECK
    const token = req.cookies._v_bid;

    if (!token) {
      return res
        .status(410) // 410 is 'Gone' - perfect for expired sessions
        .json({ success: false, message: "Session expired. Please login." });
    }

    // 4. VERIFY & ATTACH USER
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Customer.findById(decoded.id).select(
      "-password -otp -otpExpires",
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res
      .status(401)
      .json({ success: false, message: "Invalid token. Access denied." });
  }
};

module.exports = { protect };
