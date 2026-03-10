const TrackLink = require("../models/urlShortModel");

const getUrl = async (req, res) => {
  try {
    const { shortId } = req.params;

    // 1. Database Lookup
    const linkData = await TrackLink.findOne({
      shortId: shortId.toLowerCase(),
    });

    if (linkData) {
      // 2. INSTEAD OF: res.redirect(linkData.originalUrl)
      // USE THIS: Send JSON so React can read the "url" property
      return res.status(200).json({
        success: true,
        url: linkData.originalUrl,
      });
    }

    // 3. Handle not found
    res.status(404).json({ success: false, message: "Link not found" });
  } catch (error) {
    console.error("Redirect Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { getUrl };
