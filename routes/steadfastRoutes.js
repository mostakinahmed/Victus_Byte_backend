const express = require("express");
const { getPoliceStation } = require("../controllers/steadfastControler");

const router = express.Router();
router.get("/police-station", getPoliceStation);

module.exports = router;
