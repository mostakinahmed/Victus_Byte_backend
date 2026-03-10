const TrackLink = require("../models/urlShortModel");

const generateAndSaveShortLink = async (orderId) => {
  const { customAlphabet } = await import("nanoid");
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const generateShortId = customAlphabet(alphabet, 6);

  const originalUrl = `https://victusbyte.com/track-order/${orderId}`;

  let link;
  let isSaved = false;

  // Keep trying until we save a unique ID
  while (!isSaved) {
    try {
      const shortId = generateShortId();

      link = await TrackLink.create({
        shortId,
        originalUrl,
      });

      isSaved = true; // Break the loop
    } catch (error) {
      // Check if the error is a Duplicate Key Error (MongoDB Code 11000)
      if (error.code === 11000) {
        console.warn("Collision detected! Retrying with a new ID...");
        continue; // Go to the start of the loop and try a new shortId
      }

      throw error;
    }
  }

  return `https://victusbyte.com/order/${link.shortId}`;
};

module.exports = { generateAndSaveShortLink };
