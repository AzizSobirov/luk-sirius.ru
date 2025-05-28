require("dotenv").config();
const express = require("express");
const path = require("path");
const { sequelize } = require("./models");
const apiRoutes = require("./routes/api");
const { setupMiddleware } = require("./middleware");
const AuthService = require("./services/AuthService");
const TelegramBot = require("./bot");
const config = require("./config/app");

const app = express();

// Setup middleware
setupMiddleware(app);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/api", apiRoutes);

// Cleanup functions
function setupCleanupTasks() {
  // Clean database sessions every 24 hours (once per day)
  setInterval(() => {
    AuthService.cleanExpiredSessions();
  }, 24 * 60 * 60 * 1000);
}

// Graceful shutdown
function setupGracefulShutdown() {
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");

    try {
      await TelegramBot.stop();
      await sequelize.close();
      console.log("✅ Database connection closed");
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
    }

    process.exit(0);
  });
}

// Start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log("✅ Database synchronized");

    // Clean expired sessions on startup
    await AuthService.cleanExpiredSessions();

    // Setup cleanup tasks
    setupCleanupTasks();

    // Setup graceful shutdown
    setupGracefulShutdown();

    // Start web server
    app.listen(config.port, async () => {
      console.log(`🌐 Server running on port ${config.port}`);
      console.log(`📱 Frontend: http://localhost:${config.port}`);
      console.log(
        `🔗 Health check: http://localhost:${config.port}/api/health`
      );

      if (!config.botToken) {
        console.warn("⚠️  Warning: BOT_TOKEN not set in environment variables");
        return;
      }

      if (!config.botUsername) {
        console.warn(
          "⚠️  Warning: BOT_USERNAME not set. QR codes may not work properly"
        );
      }

      // Start bot after server is running
      await TelegramBot.start();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
