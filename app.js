require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const app = express();

// --- 1. SIMPLE CORS CONFIGURATION ---
const allowedOrigins = [
  "https://admin.victusbyte.com",
  "https://admin.victusbyte.top",
  "https://victusbyte.com",
  "http://localhost:5173",
];

// This single block handles both regular requests AND preflights
app.use(cors({
  origin: allowedOrigins,
  methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  credentials: true,
  optionsSuccessStatus: 200
}));

// --- 3. STANDARD MIDDLEWARES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- 4. ROUTES ---
app.use("/api/product", require("./routes/productRoutes"));
app.use("/api/category", require("./routes/categoryRoutes"));
app.use("/api/order", require("./routes/orderRoutes"));
app.use("/api/user", require("./routes/userDataRoutes"));
app.use("/api/stock", require("./routes/stockRoutes"));
app.use("/api/coupon", require("./routes/couponRoutes"));

// --- 5. HOME ROUTE ---
app.get("/", (req, res) => {
  res.send("Welcome to Victus Byte Backend! System is active.");
});

// --- 6. DATABASE CONNECTION ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// --- 7. SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
