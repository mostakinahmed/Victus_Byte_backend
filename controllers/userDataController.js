require("dotenv").config();
const UserData = require("../models/userDataModel");
const AdminData = require("../models/adminDataModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

//Admin Sign Up controller for - react Admin panel

// for create ID
function generateInternalId(role) {
  // 1. Get last 2 digits of the current millisecond
  const timePart = Date.now().toString().slice(-2);

  // 2. Generate 2 random digits (between 10 and 99)
  const randomPart = Math.floor(10 + Math.random() * 90).toString();

  if (role === "Admin") {
    // Result: 45 + Time + Random (e.g., 458291)
    return `45${timePart}${randomPart}`;
  } else if (role === "Moderator") {
    // Result: 15 + Time + Random (e.g., 158291)
    return `15${timePart}${randomPart}`;
  }
}

const adminSignUp = async (req, res) => {
  try {
    const { fullName, role, status, userName, password, phone, email, images } =
      req.body;

    const newID = generateInternalId(role);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new AdminData({
      adminID: newID,
      fullName,
      role,
      status,
      userName,
      password: hashedPassword,
      phone,
      email,
      images,
      lastLogin: null,
    });

    const savedUser = await newUser.save();

    // Send response
    res.status(201).json({
      message: "Admin created successfully",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ message: error.message });
  }
};

//Admin Update
const adminUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    let { fullName, role, status, userName, password, phone, email, images } =
      req.body;

    // Check if password exists and is not already hashed
    if (password) {
      const isHashed =
        password.startsWith("$2a$") ||
        password.startsWith("$2b$") ||
        password.startsWith("$2y$");

      if (!isHashed) {
        password = await bcrypt.hash(password, saltRounds);
      }
    }

    // Prepare update object
    const updateFields = {
      fullName,
      role,
      status,
      userName,
      phone,
      email,
      images,
    };

    if (password) {
      updateFields.password = password;
    }

    // Update the admin
    const updatedAdmin = await AdminData.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    //  Send success response
    res.status(200).json({
      message: "Admin updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(400).json({ message: error.message });
  }
};

//Admin SignIn
const adminSignIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if email exists
    const user = await AdminData.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //Account Active or Suspended check
    if (!user.status) {
      return res
        .status(403)
        .json({ message: `Account is suspended. Please contact Admin.` });
    }

    // Match password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // //Create JWT token
    // const token = jwt.sign(
    //   { email: user.email, id: user.adminID },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "2h" },
    // );

    // 4. Role Extraction Logic (The 45/15 Logic)
    // We determine the role based on the ID prefix
    const idPrefix = user.adminID.substring(0, 2);
    const role =
      idPrefix === "45" ? "admin" : idPrefix === "15" ? "employee" : "guest";

    // 5. Create JWT (Include role in payload)
    const token = jwt.sign(
      {
        email: user.email,
        id: user.adminID,
        role: role, // Baking the role into the token
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }, // Extended to a full workday
    );

    //saved login time
    await AdminData.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    user.lastLogin = new Date();
    // Send successful response
    res.status(200).json({
      message: "User logged in successfully",
      user,
      token,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Admin Check Auth
const adminCheckAuth = async (req, res) => {
  const token = req.body.token;

  if (!token) {
    return res.status(401).json({ loggedIn: false });
  }

  //if token available
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //fetch user data
    // Fetch user data from DB
    const userInfo = await AdminData.findOne({
      adminID: decoded.id, // or uID: decoded.id if you used uID
    }).select("-password"); // hide password

    res.json({ loggedIn: true, user: userInfo });
  } catch (err) {
    res
      .status(403)
      .json({ loggedIn: false, message: "Invalid or expired token" });
  }
};

// Get all Admins
const adminList = async (req, res) => {
  try {
    // Select only adminID and name (space separated)
    // The -_id excludes the default MongoDB ID if you don't need it
    // const admins = await AdminData.find().select(
    //   "adminID fullName userName -_id",
    // );
    const admins = await AdminData.find();

    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  adminSignUp,
  adminSignIn,
  adminCheckAuth,
  adminList,
  adminUpdate,
};
