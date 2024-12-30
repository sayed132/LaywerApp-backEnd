const jwt = require("jsonwebtoken");

exports.generateToken = (userInfo) => {
  const payload = {
    email: userInfo.email,
    userId: userInfo._id,
    role: userInfo.role,
  };

  // Generate token with 7 days expiry
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
  return token;
};