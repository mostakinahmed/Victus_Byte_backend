// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authorize = (allowedPrefixes) => {
  return (req, res, next) => {
    try {
      // 1. Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied: No Token" });
      }

      const token = authHeader.split(" ")[1];

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Extract prefix (45 or 15)
      const idPrefix = decoded.id.substring(0, 2);
  
      // 4. Check if the prefix is allowed for this route
      if (!allowedPrefixes.includes(idPrefix)) {
        return res.status(403).json({
          message: "Forbidden: You do not have permission for this action.",
        });
      }

   
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or Expired Token" });
    }
  };
};

module.exports = { authorize };
