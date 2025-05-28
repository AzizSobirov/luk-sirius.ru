const UserService = require("../services/UserService");
const AuthService = require("../services/AuthService");

class UserController {
  async getUser(req, res) {
    try {
      const { telegramId } = req.params;

      const user = await UserService.getUserById(telegramId);

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Get user error:", error);

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

  async completeRegistration(req, res) {
    try {
      const { telegramId, additionalData = {} } = req.body;

      if (!telegramId) {
        return res.status(400).json({
          success: false,
          error: "Telegram ID is required",
        });
      }

      await UserService.completeRegistration(telegramId, additionalData);

      console.log(`✅ User registration completed: ${telegramId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Registration completion error:", error);

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

  async getCurrentUser(req, res) {
    try {
      const { telegramId } = req.user;
      const user = await UserService.getUserById(telegramId);

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}

module.exports = new UserController();
