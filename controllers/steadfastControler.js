// Middleware to add Steadfast Auth Headers

const { default: axios } = require("axios");

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";
const steadfastHeader = {
  "Api-Key": process.env.STEADFAST_API_KEY,
  "Secret-Key": process.env.STEADFAST_SECRET_KEY,
  "Content-Type": "application/json",
};

const getPoliceStation = async (req, res) => {
  try {
    const response = await axios.get(`${STEADFAST_BASE_URL}/police_stations`, {
      headers: steadfastHeader,
    });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch from Steadfast",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = { getPoliceStation };
