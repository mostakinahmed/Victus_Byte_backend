require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

// --- FIX 1: FORCE DNS RESOLUTION (Bypass HostSheba's local DNS) ---
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]); // Uses Google and Cloudflare DNS

const app = express();

// --- 1. SIMPLE CORS CONFIGURATION ---
const allowedOrigins = [
  "https://admin.victusbyte.com",
  "https://admin.victusbyte.top",
  "https://victusbyte.com",
  "https://www.victusbyte.com",
  "http://localhost:5173",
  "https://victusbyte.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

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
app.use("/api/customer", require("./routes/customerDataRoutes"));
app.use("/api/sms-log", require("./routes/smsLogRoute"));
app.use("/", require("./routes/urlShortRoutes"));
app.use("/api/steadfast", require("./routes/steadfastRoutes"));
app.use("/api/transaction", require("./routes/transactionRoutes"));


// --- 5. HOME ROUTE ---
app.get("/", (req, res) => {
  res.send("Welcome to Victus Byte Backend! System is active.");
});

// --- 6. OPTIMIZED DATABASE CONNECTION ---
const dbOptions = {
  maxPoolSize: 5, // Limits connections to prevent firewall blocking
  serverSelectionTimeoutMS: 5000, // Fails fast instead of hanging 30s
  socketTimeoutMS: 45000,
  family: 4, // Forces IPv4 (DNS often fails on IPv6)
};

mongoose.connect(process.env.MONGO_URI, dbOptions).then(() => {
  console.log("✅ MongoDB Connected!");
  console.log("📂 Database Name:", mongoose.connection.name);
  // ^ This MUST print 'FabriBuzz'. If it says 'test', your data will be []
});

// --- 7. SERVER START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
