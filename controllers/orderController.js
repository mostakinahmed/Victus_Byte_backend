const order = require("../models/orderModel");
const stock = require("../models/stockModel");
const products = require("../models/productModel");
const coupons = require("../models/couponModel");
const axios = require("axios");
const SmsLog = require("../models/smsModel");
const TrackLink = require("../models/urlShortModel");

//url create
const generateTrackingLink = async (order_id) => {
  try {
    // 1. Dynamic Import for nanoid
    const { customAlphabet } = await import("nanoid");
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
    const generateShortId = customAlphabet(alphabet, 6);

    const originalUrl = `https://victusbyte.com/track-order/${order_id}`;

    let link;
    let isSaved = false;
    let attempts = 0;

    // 2. Collision Handling Loop
    while (!isSaved && attempts < 5) {
      attempts++;
      const shortId = generateShortId();

      try {
        link = await TrackLink.create({
          shortId,
          originalUrl,
        });
        isSaved = true;
      } catch (dbError) {
        if (dbError.code === 11000 && attempts < 5) {
          console.warn(`Collision on attempt ${attempts}. Retrying...`);
          continue;
        }
        throw dbError; // Rethrow if it's not a collision or too many attempts
      }
    }

    return `https://victusbyte.com/${link.shortId}`;
  } catch (error) {
    console.error("Helper Function Error:", error.message);
    throw new Error("Failed to generate tracking link: " + error.message);
  }
};

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
// const sendOrderSms = async (customerPhone, orderId) => {
//   try {
//     // 1. Clean and normalize number to 01XXXXXXXXX
//     let cleanNumber = customerPhone.replace(/\D/g, "");
//     if (cleanNumber.startsWith("880")) {
//       cleanNumber = cleanNumber.substring(2);
//     } else if (cleanNumber.startsWith("88")) {
//       cleanNumber = cleanNumber.substring(2);
//     }

//     if (!cleanNumber.startsWith("0")) {
//       cleanNumber = "0" + cleanNumber;
//     }

//     const message = `Victus Byte: Order #${orderId} is received!\nTrack: victusbyte.com/track-order\nHotline: 09611-342936\nStay with us, Thank you.`;

//     // 2. API Call
//     const response = await axios.get("https://bulksmsbd.net/api/smsapi", {
//       params: {
//         api_key: process.env.BULKSMS_API_KEY,
//         type: "text",
//         number: cleanNumber,
//         senderid: process.env.BULKSMS_SENDER_ID,
//         message: message,
//       },
//     });

//     // 3. Terminal Debugging
//     console.log("RAW GATEWAY DATA (Order):", response.data);
//     const statusCode = response.data.status_code;

//     if (statusCode === 202) {
//       console.log("✅ Order SMS Sent Successfully to:", cleanNumber);
//     } else {
//       console.error(
//         `❌ Order SMS Failed. Code ${statusCode}: ${response.data.message || response.data.error_message}`,
//       );

//       if (statusCode === 1032) {
//         console.log(
//           "👉 ACTION REQUIRED: Whitelist your Server IP in BulkSMSBD panel.",
//         );
//       }
//     }

//     // 4. Return data to the controller for frontend debugging
//     return response.data;
//   } catch (error) {
//     console.error("❌ Order SMS Function Error:", error.message);
//     return { success: false, error: error.message };
//   }
// };

const sendOrderSms = async (customerPhone, orderId, shortUrl) => {
  try {
    // 1. Clean and normalize number
    let cleanNumber = customerPhone.replace(/\D/g, "");
    if (cleanNumber.startsWith("880")) {
      cleanNumber = cleanNumber.substring(3); // Fix: 880 is 3 digits
    } else if (cleanNumber.startsWith("88")) {
      cleanNumber = cleanNumber.substring(2);
    }

    if (!cleanNumber.startsWith("0")) {
      cleanNumber = "0" + cleanNumber;
    }

    const message = `Victus Byte: Order #${orderId} is received!\nTrack: ${shortUrl}\nHotline: 09611-342936\nStay with us, Thank you.`;

    // 2. API Call
    const response = await axios.get("https://bulksmsbd.net/api/smsapi", {
      params: {
        api_key: process.env.BULKSMS_API_KEY,
        type: "text",
        number: cleanNumber,
        senderid: process.env.BULKSMS_SENDER_ID,
        message: message,
      },
    });

    // 3. --- SAVE TO DATABASE (Monitoring Logic) ---
    // Mapping your schema to BulkSMSBD's response keys
    await SmsLog.create({
      phoneNumber: cleanNumber,
      message: message,
      type: "ORDER",
      message_id: response.data.message_id, // From BulkSMSBD
      response_code: response.data.response_code, // From BulkSMSBD (e.g., 202)
      success_message: response.data.success_message,
      error_message: response.data.error_message || "",
    });

    // 4. Terminal Debugging
    console.log("RAW GATEWAY DATA (Order):", response.data);
    const statusCode = response.data.response_code; // Usually response_code in BulkSMSBD

    if (statusCode === 202) {
      console.log("✅ Order SMS Sent Successfully to:", cleanNumber);
    } else {
      console.error(
        `❌ Order SMS Failed. Code ${statusCode}: ${response.data.error_message}`,
      );
    }

    return response.data;
  } catch (error) {
    // Log System/Network Errors to DB too
    await SmsLog.create({
      phoneNumber: customerPhone,
      message: "Order SMS Attempt",
      error_message: error.message,
      response_code: 500,
    });

    console.error("❌ Order SMS Function Error:", error.message);
    return { success: false, error: error.message };
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

const createOrder = async (req, res) => {
  // --- Helper Function for Fallback ID ---
  const generateFallbackId = () => {
    const timePart = Date.now().toString().slice(-4); // 4 digits of time
    const randomPart = Math.floor(10 + Math.random() * 90).toString(); // 2 digits
    return timePart + randomPart;
  };

  const saveWithRetry = async (orderData) => {
    try {
      const newOrder = new order(orderData);

      return await newOrder.save();
    } catch (error) {
      // Check for MongoDB Duplicate Key Error (Code 11000)
      if (
        error.code === 11000 &&
        error.keyPattern &&
        error.keyPattern.order_id
      ) {
        console.log("Collision detected! Generating fallback ID...");

        // Update the order_id with fallback logic
        orderData.order_id = generateFallbackId();

        // Recursive call: Try saving again with the new ID
        return await saveWithRetry(orderData);
      }
      throw error; // Rethrow if it's a different error (validation, etc.)
    }
  };

  try {
    // 1. Attempt to save (Starts with ID from req.body)
    const savedOrder = await saveWithRetry(req.body);

    // 2. Link creation using the FINAL saved ID
    const shortUrl = await generateTrackingLink(savedOrder.order_id);

    // 3. Send SMS
    const smsStatus = await sendOrderSms(
      savedOrder.shipping_address.phone,
      savedOrder.order_id,
      shortUrl,
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: savedOrder,
      smsDebug: smsStatus,
    });
  } catch (error) {
    console.error("Order Creation Error:", error.message);
    res.status(400).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
};

// CREATE new Order for client
// const createOrderClient = async (req, res) => {
//   try {
//     // 1. Get client data (In production, replace dummyOrderPayload with req.body)
//     const clientOrder = req.body;

//     // 2. Extract IDs and quantities for DB verification
//     const pid = clientOrder.items.map((item) => ({
//       id: item.product_id,
//       qty: item.quantity,
//     }));

//     // 3. IMPORTANT: Wait for the DB to calculate the real values
//     const dbData = await varifyOrder(pid);

//     //coupon check
//     // 1. Check if a coupon object exists in the request
//     let verifiedCouponValue = 0;
//     if (clientOrder.coupon && clientOrder.coupon.couponID) {
//       // 2. Find the coupon in your database to verify it's real and active
//       const dbCoupon = await coupons.findOne({
//         couponID: clientOrder.coupon.couponID.toUpperCase(),
//         status: true,
//       });

//       if (!dbCoupon) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid or expired coupon code." });
//       }

//       // 3. Triple Check: Verify the subtotal meets the minTK requirement on the SERVER side
//       if (clientOrder.subtotal < dbCoupon.minTK) {
//         return res.status(400).json({
//           success: false,
//           message: `Minimum purchase of ৳${dbCoupon.minTK} required for this coupon.`,
//         });
//       }

//       // 4. Verification: Ensure the discount value sent by client matches the DB value
//       if (clientOrder.coupon.value !== dbCoupon.value) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Coupon value mismatch detected." });
//       }

//       verifiedCouponValue = dbCoupon.value;
//     }
//     // 4. THE TRIPLE CHECK (The Final Lock)
//     const isSubtotalMatch =
//       Math.round(clientOrder.subtotal) === Math.round(dbData.subtotal);
//     const isDiscountMatch =
//       Math.round(clientOrder.discount) === Math.round(dbData.totalDiscount);

//     const expectedTotal =
//       dbData.subtotal -
//       dbData.totalDiscount +
//       clientOrder.shipping_cost -
//       verifiedCouponValue;

//     const isTotalAmountMatch =
//       Math.round(clientOrder.total_amount) === Math.round(expectedTotal);

//     if (isSubtotalMatch && isDiscountMatch && isTotalAmountMatch) {
//       // 5. Success! Now we save to MongoDB
//       const newOrder = new order(clientOrder);
//       const savedProduct = await newOrder.save();

//       //create short link and save it db
//       const shortUrl = await generateTrackingLink(newOrder.order_id);

//       // Send SMS
//       const smsStatus = await sendOrderSms(
//         savedProduct.shipping_address.phone,
//         savedProduct.order_id,
//         shortUrl,
//       );

//       res
//         .status(201)
//         .json({ success: true, data: savedProduct, smsDebug: smsStatus });
//     } else {
//       res.status(400).json({
//         success: false,
//         message:
//           "Security Alert: Order verification failed. Price or Discount mismatch!",
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const createOrderClient = async (req, res) => {
  // --- Helper: Generate Fallback 6-digit ID (4 Time + 2 Random) ---
  const generateFallbackId = () => {
    const timePart = Date.now().toString().slice(-4);
    const randomPart = Math.floor(10 + Math.random() * 90).toString();
    return timePart + randomPart;
  };

  // --- Helper: Recursive Save Function ---
  const saveWithRetry = async (orderData) => {
    try {
      const newOrder = new order(orderData);
      return await newOrder.save();
    } catch (error) {
      // Catch MongoDB Duplicate Key Error for order_id
      if (error.code === 11000 && error.keyPattern?.order_id) {
        console.warn(`Collision! Retrying with new ID...`);
        orderData.order_id = generateFallbackId();
        return await saveWithRetry(orderData);
      }
      throw error;
    }
  };

  try {
    const clientOrder = req.body;

    // 1. Verification Logic (Subtotal, Discount, etc.)
    const pid = clientOrder.items.map((item) => ({
      id: item.product_id,
      qty: item.quantity,
    }));

    const dbData = await varifyOrder(pid);

    let verifiedCouponValue = 0;
    if (clientOrder.coupon && clientOrder.coupon.couponID) {
      const dbCoupon = await coupons.findOne({
        couponID: clientOrder.coupon.couponID.toUpperCase(),
        status: true,
      });

      if (!dbCoupon)
        return res
          .status(400)
          .json({ success: false, message: "Invalid coupon." });
      if (clientOrder.subtotal < dbCoupon.minTK)
        return res
          .status(400)
          .json({ success: false, message: "Min purchase not met." });
      if (clientOrder.coupon.value !== dbCoupon.value)
        return res
          .status(400)
          .json({ success: false, message: "Coupon mismatch." });

      verifiedCouponValue = dbCoupon.value;
    }

    // 2. Triple Check Calculations
    const isSubtotalMatch =
      Math.round(clientOrder.subtotal) === Math.round(dbData.subtotal);
    const isDiscountMatch =
      Math.round(clientOrder.discount) === Math.round(dbData.totalDiscount);
    const expectedTotal =
      dbData.subtotal -
      dbData.totalDiscount +
      clientOrder.shipping_cost -
      verifiedCouponValue;
    const isTotalAmountMatch =
      Math.round(clientOrder.total_amount) === Math.round(expectedTotal);

    if (isSubtotalMatch && isDiscountMatch && isTotalAmountMatch) {
      // 3. SECURE SAVE WITH RETRY (Handles collisions automatically)
      const savedProduct = await saveWithRetry(clientOrder);

      // 4. Post-Save Operations (Use savedProduct.order_id in case it changed!)
      const shortUrl = await generateTrackingLink(savedProduct.order_id);

      const smsStatus = await sendOrderSms(
        savedProduct.shipping_address.phone,
        savedProduct.order_id,
        shortUrl,
      );

      res.status(201).json({
        success: true,
        data: savedProduct,
        smsDebug: smsStatus,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Security Alert: Price or Discount mismatch!",
      });
    }
  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// varify price request
const varifyOrder = async (pid) => {
  // Initialize our "Source of Truth" object
  let orderSummary = {
    subtotal: 0,
    totalDiscount: 0,
  };

  // 1. Loop through each item in the order
  for (const item of pid) {
    // 2. Fetch REAL data from MongoDB (wait for the handshake)
    const pData = await products.findOne({ pID: item.id });

    if (pData) {
      // 3. Calculate the discount for this item
      const itemDiscountTotal = (pData.price.discount || 0) * item.qty;
      const itemSellingTotal = pData.price.selling * item.qty;

      // 4. Update the totals
      orderSummary.subtotal += itemSellingTotal;
      orderSummary.totalDiscount += itemDiscountTotal;
    }
  }

  return orderSummary;
};

// PATCH /orders/:orderId
// const orderUpdate = async (req, res) => {
//   try {
//     // Ensure route param matches
//     const { orderId } = req.params;
//     const updates = req.body;

//     if (!orderId) {
//       return res
//         .status(400)
//         .json({ message: "Order ID is required in params" });
//     }

//     // Find order by correct DB field (replace 'order_id' if your field is different)
//     const orderData = await order.findOne({ order_id: orderId });
//     if (!orderData) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // Update payment status if provided
//     if (updates.payment?.status) {
//       orderData.payment.status = updates.payment.status;
//     }

//     // 4️⃣ Update order status if provided
//     if (updates.status) {
//       orderData.status = updates.status;
//     }

//     // Update items (SKU & IMEI)
//     if (updates.items && Array.isArray(updates.items)) {
//       updates.items.forEach((itemUpdate) => {
//         const item = orderData.items.find(
//           (i) => i.product_id === itemUpdate.product_id,
//         );

//         if (!item) return;

//         // Update SKU
//         if (itemUpdate.skuID !== undefined) item.skuID = itemUpdate.skuID;

//         // Update IMEI (single string)
//         if (itemUpdate.imei !== undefined) {
//           item.imei = itemUpdate.imei; // just store the string directly
//         }
//       });
//     }

//     //update order selling price, sku status, OID
//     if (orderData.status === "Confirmed") {
//       try {
//         // 2. Map through items to update the SKU Ledger
//         const updatePromises = orderData.items.map(async (item) => {
//           return await stock.findOneAndUpdate(
//             {
//               pID: item.product_id,
//               "SKU.skuID": item.skuID,
//             },
//             {
//               $set: {
//                 "SKU.$.status": false, // 1. Update Status (Sold)
//                 "SKU.$.OID": orderData.order_id, // 2. Link OID
//               },
//             },
//             { new: true },
//           );
//         });

//         await Promise.all(updatePromises);
//         return savedOrder;
//       } catch (err) {
//         console.error("Stock Update Error:", err);
//         throw err;
//       }
//     }

//     // Save the updated order
//     await orderData.save();

//     res.status(200).json({ message: "Order updated successfully", orderData });
//   } catch (error) {
//     console.error("Order update error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const orderUpdate = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const orderData = await order.findOne({ order_id: orderId });
    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 1. Update Payment & Status
    if (updates.payment?.status)
      orderData.payment.status = updates.payment.status;
    if (updates.status) orderData.status = updates.status;

    // 2. Update Items (SKU & IMEI)
    if (updates.items && Array.isArray(updates.items)) {
      updates.items.forEach((itemUpdate) => {
        const item = orderData.items.find(
          (i) => i.product_id === itemUpdate.product_id,
        );
        if (item) {
          if (itemUpdate.skuID !== undefined) item.skuID = itemUpdate.skuID;
          if (itemUpdate.imei !== undefined) item.imei = itemUpdate.imei;
        }
      });
    }

    // 3. Stock Update Logic (Triggered when Status becomes "Confirmed")
    if (orderData.status === "Shipped") {
      const numOrder = orderData.items.length || 1;

      const updatePromises = orderData.items.map(async (item) => {
        // ✅ Calculate Rounded Selling Price
        // (Product Price - (Total Coupons + Total Discount / Number of Items))
        const discountPortion =
          ((orderData.coupon?.value || 0) + (orderData.discount || 0)) /
          numOrder;
        const finalSellingPrice = Math.round(
          item.product_price - discountPortion,
        );

        return await stock.findOneAndUpdate(
          {
            pID: item.product_id,
            "SKU.skuID": item.skuID,
            // "SKU.status": true // Comment this out temporarily to see if it's a matching issue
          },
          {
            $set: {
              "SKU.$.status": false, // Use literal false
              "SKU.$.OID": orderData.order_id,
            },
          },
          {
            new: true,
            runValidators: false, // Skip validation to ensure the 'false' value is forced through
          },
        );
      });

      const results = await Promise.all(updatePromises);

      // Check if any stock update failed (e.g., SKU already sold)
      if (results.includes(null)) {
        return res
          .status(409)
          .json({ message: "One or more SKUs are already sold or not found." });
      }
    }

    // 4. Save and Respond
    await orderData.save();
    res.status(200).json({ message: "Order updated successfully", orderData });
  } catch (error) {
    console.error("Order update error:", error);
    // Don't just say Internal Error, let's see the message
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

module.exports = {
  createOrder,
  getAllOrder,
  orderUpdate,
  getSmsBalance,
  createOrderClient,
};
