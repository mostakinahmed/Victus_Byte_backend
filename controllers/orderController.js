const order = require("../models/orderModel");
const stock = require("../models/stockModel");
const products = require("../models/productModel");
const coupons = require("../models/couponModel");
const axios = require("axios");
const SmsLog = require("../models/smsModel");
const TrackLink = require("../models/urlShortModel");

// ==========================================
// 1. GLOBAL HELPERS
// ==========================================

const generateFallbackId = () => {
  const timePart = Date.now().toString().slice(-4);
  const randomPart = Math.floor(10 + Math.random() * 90).toString();
  return timePart + randomPart;
};

const saveWithRetry = async (orderData) => {
  try {
    const newOrder = new order(orderData);
    return await newOrder.save();
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.order_id) {
      console.warn("Order ID Collision, retrying...");
      orderData.order_id = generateFallbackId();
      return await saveWithRetry(orderData);
    }
    throw error;
  }
};

const verifyOrder = async (items) => {
  let orderSummary = { subtotal: 0, totalItemDiscounts: 0 };
  if (!items || !Array.isArray(items)) return orderSummary;

  for (const item of items) {
    const pData = await products.findOne({ pID: item.product_id });
    if (pData) {
      const dbPrice = pData.price.selling || 0;
      const dbDiscount = pData.price.discount || 0;
      orderSummary.subtotal += dbPrice;
      orderSummary.totalItemDiscounts += dbDiscount;
    }
  }
  return orderSummary;
};

const generateTrackingLink = async (order_id) => {
  try {
    const { customAlphabet } = await import("nanoid");
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
    const generateShortId = customAlphabet(alphabet, 6);
    const originalUrl = `https://victusbyte.com/track-order/${order_id}`;

    let link;
    let isSaved = false;
    let attempts = 0;

    while (!isSaved && attempts < 5) {
      attempts++;
      const shortId = generateShortId();
      try {
        link = await TrackLink.create({ shortId, originalUrl });
        isSaved = true;
      } catch (dbError) {
        if (dbError.code === 11000) continue;
        throw dbError;
      }
    }
    return `https://victusbyte.com/${link.shortId}`;
  } catch (error) {
    console.error("Tracking Link Error:", error.message);
    return `https://victusbyte.com/track-order/${order_id}`; // Fallback to long URL
  }
};

const sendOrderSms = async (customerPhone, orderId, shortUrl) => {
  try {
    let cleanNumber = customerPhone.replace(/\D/g, "");
    if (cleanNumber.startsWith("880")) cleanNumber = cleanNumber.substring(3);
    else if (cleanNumber.startsWith("88"))
      cleanNumber = cleanNumber.substring(2);
    if (!cleanNumber.startsWith("0")) cleanNumber = "0" + cleanNumber;

    const message = `Victus Byte: Order #${orderId} is received!\nTrack: ${shortUrl}\nHotline: 09611-342936\nStay with us, Thank you.`;

    const response = await axios.get("https://bulksmsbd.net/api/smsapi", {
      params: {
        api_key: process.env.BULKSMS_API_KEY,
        type: "text",
        number: cleanNumber,
        senderid: process.env.BULKSMS_SENDER_ID,
        message: message,
      },
    });

    await SmsLog.create({
      phoneNumber: cleanNumber,
      message: message,
      type: "ORDER",
      message_id: response.data.message_id,
      response_code: response.data.response_code,
      success_message: response.data.success_message,
      error_message: response.data.error_message || "",
    });

    return response.data;
  } catch (error) {
    console.error("SMS Error:", error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// 2. CONTROLLERS
// ==========================================

// --- CLIENT SIDE CHECKOUT ---
const createOrderClient = async (req, res) => {
  try {
    const clientOrder = req.body;
    if (!clientOrder.items || clientOrder.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Recalculate totals from DB for security
    const dbData = await verifyOrder(clientOrder.items);

    // Coupon Verification
    let verifiedCouponValue = 0;
    if (clientOrder.coupon && clientOrder.coupon.couponID) {
      const dbCoupon = await coupons.findOne({
        couponID: clientOrder.coupon.couponID.toUpperCase(),
        status: true,
      });
      if (dbCoupon && clientOrder.subtotal >= (dbCoupon.minTK || 0)) {
        verifiedCouponValue = dbCoupon.value;
      }
    }

    // Security Calculation: Final = Subtotal - Individual Discounts + Shipping - Coupon
    const expectedTotal =
      dbData.subtotal -
      dbData.totalItemDiscounts +
      (clientOrder.courier.delivery_charge || 0) -
      verifiedCouponValue;

    const isMatch =
      Math.round(clientOrder.total_amount) === Math.round(expectedTotal);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Verification Mismatch!",
        debug: { received: clientOrder.total_amount, expected: expectedTotal },
      });
    }

    const savedOrder = await saveWithRetry(clientOrder);

    // Non-blocking post-save actions
    setImmediate(async () => {
      try {
        const shortUrl = await generateTrackingLink(savedOrder.order_id);
        await sendOrderSms(
          savedOrder.shipping_address.phone,
          savedOrder.order_id,
          shortUrl,
        );
      } catch (err) {
        console.error("Post-save failed:", err.message);
      }
    });

    return res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    console.error("createOrderClient Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ADMIN ORDER UPDATE (SKU/IMEI Assignment) ---
const orderUpdate = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;
    const orderData = await order.findOne({ order_id: orderId });

    if (!orderData) return res.status(404).json({ message: "Order not found" });

    // 1. Update SKU/IMEI mapping by Array Index
    if (updates.items && Array.isArray(updates.items)) {
      updates.items.forEach((itemUpdate, idx) => {
        if (orderData.items[idx]) {
          if (itemUpdate.skuID !== undefined)
            orderData.items[idx].skuID = itemUpdate.skuID;
          if (itemUpdate.imei !== undefined)
            orderData.items[idx].imei = itemUpdate.imei;
        }
      });
    }

    if (updates.status) orderData.courier.delivery_status = updates.status;

    // Check if payment exists before accessing .status or .method
    if (updates.payment) {
      if (updates.payment.status) {
        orderData.courier.payment_status = updates.payment.status;
      }
      if (updates.payment.method) {
        orderData.courier.payment_method = updates.payment.method;
      }
    }
    // if (updates.payment?.status)
    //   orderData.courier.cash_status = updates.payment.status;
    // orderData.courier.payment_method = updates.payment.method;

    // 2. SHIPPED STATUS LOGIC: Deduct from stock & record real profit
    if (updates.status === "Confirmed") {
      const numItems = orderData.items.length || 1;
      const couponShare = (orderData.coupon?.value || 0) / numItems;

      const updatePromises = orderData.items.map(async (item) => {
        if (!item.skuID) return null;

        // Final Price = Individual Unit Price - Split Coupon
        const finalSellingPrice = Math.round(item.product_price - couponShare);

        return await stock.findOneAndUpdate(
          { pID: item.product_id, "SKU.skuID": item.skuID },
          {
            $set: {
              "SKU.$.status": false,
              "SKU.$.OID": orderData.order_id,
              "SKU.$.selling_price": finalSellingPrice,
            },
          },
          { new: true },
        );
      });

      const results = await Promise.all(updatePromises);
      if (results.includes(null)) {
        return res
          .status(409)
          .json({ message: "One or more SKUs not found in stock database." });
      }
    }

    await orderData.save();
    res.status(200).json({ success: true, message: "Order Synced", orderData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- GENERAL ORDERS ---
const createOrder = async (req, res) => {
  try {
    const savedOrder = await saveWithRetry(req.body);
    const shortUrl = await generateTrackingLink(savedOrder.order_id);
    await sendOrderSms(
      savedOrder.shipping_address.phone,
      savedOrder.order_id,
      shortUrl,
    );
    res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllOrder = async (req, res) => {
  try {
    const orders = await order.find(
      req.query.orderStatus ? { status: req.query.orderStatus } : {},
    );
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSmsBalance = async (req, res) => {
  try {
    const response = await axios.get(
      `http://bulksmsbd.net/api/getBalanceApi?api_key=${process.env.BULKSMS_API_KEY}`,
    );
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch balance" });
  }
};

//edit order
// order.controller.js

const editOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    let updates = req.body;

    // 1. Fetch existing order
    const existingOrder = await order.findOne({ order_id: orderId });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Victus Byte Error: Order ID not found",
      });
    }

    // 2. Financial Sync Logic
    // We check if the incoming update contains a new delivery charge
    const incomingCharge = updates["courier.delivery_charge"];

    if (incomingCharge !== undefined) {
      const currentCharge = Number(existingOrder.courier?.delivery_charge || 0);
      const newCharge = Number(incomingCharge);

      if (newCharge !== currentCharge) {
        // Calculate difference and adjust total_amount
        const difference = newCharge - currentCharge;
        updates.total_amount = Number(existingOrder.total_amount) + difference;
      }
    }

    // 3. Perform the Update
    // Using $set with dot notation prevents overwriting the whole 'courier' object
    const updatedOrder = await order.findOneAndUpdate(
      { order_id: orderId },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Victus Byte: Order & Financials synced",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Victus Byte Financial Sync Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server Sync Error",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getAllOrder,
  orderUpdate,
  getSmsBalance,
  createOrderClient,
  editOrder,
};
