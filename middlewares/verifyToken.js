const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const Token = require("../models/Token.model");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers?.authorization?.split(" ")[1];

    // Check if token is provided
    if (!token) {
      return res.status(403).json({
        status: "failed",
        message: "No token provided",
        error: "You are not logged in",
      });
    }

    // Decode the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

    // Attach user details to the request object
    req.user = decoded;

    // Check if the token exists in the database
    const tokenRecord = await Token.findOne({
      userId: decoded.userId,
      "tokens.token": token, // Match the token in the tokens array
    });

    if (!tokenRecord) {
      return res.status(403).json({
        status: "failed",
        message: "Token is invalid or has been revoked",
        error: "You are not authorized",
      });
    }

    // Proceed to the next middleware
    next();
  } catch (error) {
    res.status(403).json({
      status: "failed",
      error: "Invalid token",
      message: error.message,
    });
  }
};
