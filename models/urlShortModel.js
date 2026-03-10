const mongoose = require("mongoose");

const urlShortSchema = new mongoose.Schema({
  shortId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  originalUrl: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: '60d' // Links will auto-delete after 60 days to keep DB clean
  }
});

module.exports = mongoose.model("TrackLink", urlShortSchema);