const jwt = require("jsonwebtoken");
const Customer = require("../models/customerDataModel"); // Adjust path to your model

const protect = async (req, res, next) => {
  try {
    // 1. Get the tricky cookie from the request
    const token = req.cookies._v_bid;
   

    if (!token) {
      return res
        .status(410)
        .json({ success: false, message: "Session expired. Please login." });
    }

    // 2. Verify the JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find the user in DB (excluding sensitive data like password/otp)
    const user = await Customer.findById(decoded.id).select(
      "-password -otp -otpExpires",
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User no longer exists." });
    }

    // 4. Attach the user object to the 'req' so the next function can use it
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
