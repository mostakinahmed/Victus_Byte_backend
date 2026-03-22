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
    discount: { type: Number, default: 0 },
    product_comments: { type: String, default: "" },
  },
  { _id: false },
); // <-- disables _id for items

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
  subtotal: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  shipping_address: { type: ShippingAddressSchema, required: true },

  courier: {
    name: { type: String, default: "N/A" },
    consignment_id: { type: String, default: "N/A" },
    delivery_status: { type: String, default: "Pending" },
    payment_status: { type: String, default: "Pending" },
    payment_method: {
      type: String,
      default: "N/A",
    },
    del_type: { type: String, default: "COD" },
    
    total_cod_amount: { type: Number, default: 0, min: 0 },
    delivery_charge: { type: Number, default: 0, min: 0 },
    cod_fee: { type: Number, default: 0, min: 0 },
    cod_percent: { type: Number, default: 1 },
  },
});

// Export model
const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
