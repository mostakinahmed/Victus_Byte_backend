require("dotenv").config();
const Customer = require("../models/customerDataModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//sms part
//sms
const sendOrderSms = async (customerPhone, otp) => {
  try {
    let cleanNumber = customerPhone.replace(/\D/g, "");
    if (cleanNumber.startsWith("88")) cleanNumber = cleanNumber.substring(2);

    const message = `Victus Byte: Your OTP is ${otp}.
     Valid for 5 minutes. 
     Do not share this code with anyone.`;

    // Capture the response in a variable
    const response = await axios.get("https://bulksmsbd.net/api/smsapi", {
      params: {
        api_key: process.env.BULKSMS_API_KEY,
        type: "text",
        number: cleanNumber,
        senderid: process.env.BULKSMS_SENDER_ID,
        message: message,
      },
    });
  } catch (error) {
    console.error("❌ Network/Axios Error:", error.message);
  }
};

const customerSignUp = async (req, res) => {
  const { userName, email, phone, password } = req.body;

  try {
    // 1. Check if user already exists
    let user = await Customer.findOne({ $or: [{ phone }] });

    if (user && user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account already exists. Please Sign In.",
      });
    }

    // 2. Prepare Auth Data
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (user && !user.isVerified) {
      // SCENARIO: Update unverified user (Forgot pass or retry)
      user.userName = userName;
      user.email = email;
      user.password = hashedPassword;
      user.otp = generatedOtp;
      user.otpExpires = otpExpires;
      await user.save();
    } else {
      // SCENARIO: Brand New User
      const phoneSuffix = phone.slice(-3);
      const timeSuffix = Date.now().toString().slice(-3);
      const newCID = `VB${phoneSuffix}-${timeSuffix}`;

      user = new Customer({
        cID: newCID,
        userName,
        email,
        phone,
        password: hashedPassword,
        otp: generatedOtp,
        otpExpires: otpExpires,
        isVerified: false,
        // gender and images will use Schema defaults ("Other" and avatar URL)
      });

      await user.save();
    }

    // 3. SMS Integration (Placeholder)
    sendOrderSms(phone, generatedOtp);

    res.status(200).json({
      success: true,
      message: "OTP sent! Please verify your phone.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//otp Varification:
const varifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const user = await Customer.findOne({ phone });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP code." });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please signup again.",
      });
    }

    // Activate the user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // 1. Prepare Payload
    const payload = {
      id: user._id,
      email: user.email,
      cID: user.cID,
    };

    // 2. Generate Token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 3. SET THE COOKIE
    res.cookie("_v_bid", token, {
      httpOnly: true, // Security: Prevents XSS attacks
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Cross-site support
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    });

    // 4. Send Response (Token is now optional in body since it's in a cookie)
    res.status(200).json({
      success: true,
      message: "Verification successful! Welcome to Victus Byte.",
      user: {
        cID: user.cID,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Logout request
const logout = async (req, res) => {
  try {
    // We "clear" the cookie by setting its expiration to the past (Date.now(0))
    res.cookie("_v_bid", "", {
      httpOnly: true,
      expires: new Date(0), // Sets expiration to 1970, effectively deleting it
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({
      success: true,
      message: "Logged out from Victus Byte successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//get profile data
const getProfile = async (req, res) => {
  try {
    // req.user was populated by the 'protect' middleware above
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile.",
    });
  }
};

const customerSignIn = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 1. Check if user exists
    const user = await Customer.findOne({ phone });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 2. Compare Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // 3. Create JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 4. Send Cookie with the "Global Path" fix
    res.cookie("_v_bid", token, {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/", // <--- CRITICAL: Makes cookie work on all pages
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 5. Response (Don't send password or OTP back)
    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.userName}`,
      data: {
        id: user._id,
        userName: user.userName,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("SignIn Error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const customerList = () => {};
const customerUpdate = () => {};
module.exports = {
  customerSignUp,
  customerSignIn,
  varifyOTP,
  customerList,
  customerUpdate,
  logout,
  getProfile,
};
