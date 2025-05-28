const express = require("express");
const AuthController = require("../controllers/AuthController");
const UserController = require("../controllers/UserController");
const HealthController = require("../controllers/HealthController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Health check
router.get("/health", HealthController.getHealth);

// Auth routes
router.post("/auth/generate", AuthController.generateAuth);
router.get("/auth/status/:key", AuthController.getAuthStatus);
router.post("/auth/register", AuthController.registerUser);
router.get("/auth/check/:snils", AuthController.checkUserSNILS);

// User routes
router.get("/user/me", verifyToken, UserController.getCurrentUser);
router.get("/user/:telegramId", verifyToken, UserController.getUser);
router.post(
  "/user/complete-registration",
  verifyToken,
  UserController.completeRegistration
);

module.exports = router;
