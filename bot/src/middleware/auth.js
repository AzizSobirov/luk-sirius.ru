const jwt = require("jsonwebtoken");
const config = require("../config/app");

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  if (!bearerHeader) {
    return res.status(401).json({
      success: false,
      error: "No token provided",
    });
  }

  const token = bearerHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

module.exports = { verifyToken };
