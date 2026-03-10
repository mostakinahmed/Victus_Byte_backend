const express = require("express");
const {
  getUrl,

} = require("../controllers/urlShortController.js");

const router = express.Router();

//public route
router.get("/order/:shortId", getUrl);

module.exports = router;
