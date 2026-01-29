const mongoose = require("mongoose");

// Schema for individual items (disable _id)
const OrderItemSchema = new mongoose.Schema(
  {
    product_id: { type: String, required: true },
    skuID: { type: String, default: "" },
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    product_price: { type: Number, required: true },
    imei: { type: String, default: "" },
    product_comments: { type: String, default: "" },
  },
  { _id: false },
); // <-- disables _id for items

// Schema for payment details (disable _id)
const PaymentSchema = new mongoose.Schema(
  {
    method: { type: String, required: true },
    status: { type: String, required: true },
  },
  { _id: false },
);

// Schema for shipping address (disable _id)
const ShippingAddressSchema = new mongoose.Schema(
  {
    recipient_name: { type: String, required: true },
    phone: { type: String, required: true },
    address_line1: { type: String, required: true },
    email: { type: String, default: "Null" },
  },
  { _id: false },
);

// Main order schema
const OrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  order_date: { type: String, required: true },
  coupon: { type: Object, default: null },
  mode: { type: String, required: true },
  customer_id: { type: String, default: "" },
  items: { type: [OrderItemSchema], required: true },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  shipping_cost: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  payment: { type: PaymentSchema, required: true },
  shipping_address: { type: ShippingAddressSchema, required: true },
  status: { type: String, required: true, default: "Pending" },
});

// Export model
const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
