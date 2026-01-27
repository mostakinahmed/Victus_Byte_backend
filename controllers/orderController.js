const order = require("../models/orderModel");
const multer = require("multer");
const axios = require("axios");

//------balance check api
// Function to check BulkSmsBD balance
const getSmsBalance = async (req, res) => {
  try {
    const apiKey = process.env.BULKSMS_API_KEY?.trim();

    // We use the EXACT URL format that you proved works in the browser
    const url = `http://bulksmsbd.net/api/getBalanceApi?api_key=${apiKey}`;

    const response = await axios.get(url);
    // Send the data back to your Admin Panel
    res.status(200).json(response.data);
  } catch (error) {
    console.error("❌ Balance Fetch Error:", error.message);
    res.status(500).json({
      message: "Failed to fetch balance",
      error: error.message,
    });
  }
};

//sms
const sendOrderSms = async (customerPhone, orderId) => {
  try {
    let cleanNumber = customerPhone.replace(/\D/g, "");
    if (cleanNumber.startsWith("88")) cleanNumber = cleanNumber.substring(2);

    const message = `Victus Byte: Order #${orderId} is received!
Track: victusbyte.com/track-order
Hotline: 09611-342936
Stay with us, Thank you.`;

    // Capture the response in a variable
    const response = await axios.get("http://bulksmsbd.net/api/smsapi", {
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

//all the order list
const getAllOrder = async (req, res) => {
  try {
    const filter = {};

    // Check if category param exists
    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus;
    }

    const orders = await order.find(filter);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Insert into MongoDB
// CREATE new Order
const createOrder = async (req, res) => {
  try {
    const newOrder = new order(req.body); // Data from request
    const savedProduct = await newOrder.save();

    //sms funciton
    sendOrderSms(savedProduct.shipping_address.phone, savedProduct.order_id);

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /orders/:orderId
const orderUpdate = async (req, res) => {
  try {
    // Ensure route param matches
    const { orderId } = req.params;
    const updates = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ message: "Order ID is required in params" });
    }

    // Find order by correct DB field (replace 'order_id' if your field is different)
    const orderData = await order.findOne({ order_id: orderId });
    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update payment status if provided
    if (updates.payment?.status) {
      orderData.payment.status = updates.payment.status;
    }

    // 4️⃣ Update order status if provided
    if (updates.status) {
      orderData.status = updates.status;
    }

    // Update items (SKU & IMEI)
    if (updates.items && Array.isArray(updates.items)) {
      updates.items.forEach((itemUpdate) => {
        const item = orderData.items.find(
          (i) => i.product_id === itemUpdate.product_id,
        );

        if (!item) return;

        // Update SKU
        if (itemUpdate.skuID !== undefined) item.skuID = itemUpdate.skuID;

        // Update IMEI (single string)
        if (itemUpdate.imei !== undefined) {
          item.imei = itemUpdate.imei; // just store the string directly
        }
      });
    }

    // Save the updated order
    await orderData.save();

    res.status(200).json({ message: "Order updated successfully", orderData });
  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createOrder,
  getAllOrder,
  orderUpdate,
  getSmsBalance,
};
