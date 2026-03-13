const mongoose = require("mongoose");

const skuSchema = new mongoose.Schema(
  {
    skuID: { type: String, required: true },
    OID: { type: String, default: null },
    cost: { type: Number, default: 0 },
    comment: { type: String },
    status: { type: Boolean, default: true },
  },
  { _id: false, timestamps: true, versionKey: false },
);

const stockSchema = new mongoose.Schema({
  sID: { type: String, required: true, trim: true, unique: true }, // optional: unique per stock
  pID: { type: String, required: true, trim: true, unique: true }, // one stock per product
  SKU: { type: [skuSchema], default: [] }, // multiple SKUs per stock
});
//always convert time utc to local
module.exports = mongoose.model("stock", stockSchema);
