require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// Routes
app.use("/api/product", require("./routes/productRoutes"));
app.use("/api/category", require("./routes/categoryRoutes"));
app.use("/api/order", require("./routes/orderRoutes"));
app.use("/api/user", require("./routes/userDataRoutes"));
app.use("/api/stock", require("./routes/stockRoutes"));

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to Fabribuzz App Backend.....");
});

// MongoDB Connection (Atlas)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

// Start server (CRITICAL FIX)
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
