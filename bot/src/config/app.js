require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  sessionExpireMinutes: parseInt(process.env.SESSION_EXPIRE_MINUTES) || 5,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  botToken: process.env.BOT_TOKEN,
  botUsername: process.env.BOT_USERNAME,
  env: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
};
