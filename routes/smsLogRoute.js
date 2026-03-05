const express = require("express");
const { getSmsLog } = require("../controllers/smsLogController.js");
const { authorize } = require("../middlewares/apiMiddleware.js");

const router = express.Router();
router.get("/", getSmsLog);

module.exports = router;
