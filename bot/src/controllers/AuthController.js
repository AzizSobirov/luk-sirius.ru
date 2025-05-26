const AuthService = require("../services/AuthService");
const { AuthSession } = require("../models");

class AuthController {
  async generateAuth(req, res) {
    try {
      const result = await AuthService.createAuthSession();
      const botUrl = AuthService.getBotUrl(result.authKey);

      res.json({
        success: true,
        authKey: result.authKey,
        qrData: botUrl,
        expiresAt: result.expiresAt.toISOString(),
        expiresInSeconds: result.expiresInSeconds,
      });

      console.log(
        `🔑 Generated auth key: ${result.authKey.substring(0, 8)}...`
      );
    } catch (error) {
      console.error("Auth generation error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getAuthStatus(req, res) {
    try {
      const { key } = req.params;
      const result = await AuthService.getSessionStatus(key);
      res.json(result);
    } catch (error) {
      console.error("Auth status error:", error);

      if (error.message === "Invalid session key") {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async registerUser(req, res) {
    try {
      const { telegramId, username, firstName, lastName, phone } = req.body;

      if (!telegramId) {
        return res.status(400).json({
          success: false,
          error: "Telegram ID is required",
        });
      }

      const result = await AuthService.registerUser({
        telegramId,
        username,
        firstName,
        lastName,
        phone,
      });

      res.json({
        success: true,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      console.error("Registration error:", error);

      if (error.message === "User already exists") {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}

module.exports = new AuthController();
