require("dotenv").config();
const Customer = require("../models/customerDataModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const axios = require("axios");

//sms part
const sendOrderSms = async (customerPhone, otp) => {
  try {
    let cleanNumber = customerPhone.replace(/\D/g, "");
    if (cleanNumber.startsWith("88")) cleanNumber = cleanNumber.substring(2);

    const message = `Victus Byte: Your OTP is ${otp}.
     Valid for 5 minutes. Do not share this code with anyone.`;

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

//token create
const createTokenAndSetCookie = (user, res) => {
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

  // 3. SET THE COOKIE (Using your exact settings)
  res.cookie("_v_bid", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
  });

  return token;
};

//customer signup
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
    // const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const generatedOtp = 454545;

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
      message: "Sign Up Successfull.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//otp Varification:
const varifyOTP = async (req, res) => {
  const { phone, otp, isSignupFlow } = req.body; // Pass a flag from the frontend

  try {
    const user = await Customer.findOne({ phone });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // 1. Check OTP
    if (user.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP code." });
    }

    // 2. Check Expiry
    if (new Date() > user.otpExpires) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired." });
    }

    // 3. Update User Status
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // 4. THE INNER CONDITION:
    if (isSignupFlow) {
      createTokenAndSetCookie(user, res);
    }

    res.status(200).json({
      success: true,
      message: isSignupFlow
        ? "Account verified and logged in!"
        : "Phone verified. You can now reset your password.",
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

// --- Corrected Sign In ---
const customerSignIn = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 1. Find user
    const user = await Customer.findOne({ phone });

    // 2. Check existence and verification status
    if (!user || !user.isVerified) {
      return res.status(404).json({
        success: false,
        message: "User not found or account not verified",
      });
    }

    // 3. Compare Password
    const isMatch = await bcrypt.compare(password, user.password);

    // 4. Handle Incorrect Password
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    // 5. SUCCESS: Manual call to set the cookie
    createTokenAndSetCookie(user, res);

    // 6. Final Response
    return res.status(200).json({
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
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

//forget pass user search
const forgotPasswordSearch = async (req, res) => {
  try {
    const { phone } = req.body;

    // 1. Check if user exists
    const user = await Customer.findOne({ phone });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found with this number" });
    }

    // 2. Generate OTP (6 digits)
    //const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = 454545;

    // 3. Save OTP to user record (with expiry)
    user.otp = otp;
    user.otpExpires = Date.now() + 300000; // 5 minutes
    await user.save();

    // 4. Send SMS (Integrate your ForBulkSMS or other gateway here)
    // await sendSMS(phone, `Your Victus Byte password reset code is: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP sent to your phone",
      user: {
        userName: user.userName,
        images: user.images || null, // For the "Welcome Mostakin" part
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//reset password
//reset password
const resetPassword = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 1. Find user
    const user = await Customer.findOne({ phone });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 2. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Update password and clear OTP fields
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // 4. OPTIONAL: Auto-login after reset
    //createTokenAndSetCookie(user, res);

    res.status(200).json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to reset password" });
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
  resetPassword,
  forgotPasswordSearch,
};
