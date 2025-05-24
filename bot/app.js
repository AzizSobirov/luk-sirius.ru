require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const {
  Bot,
  GrammyError,
  HttpError,
  Keyboard,
  InlineKeyboard,
} = require("grammy");
const crypto = require("crypto");
const path = require("path");
const cors = require("cors");

const app = express();
const bot = new Bot(process.env.BOT_TOKEN);

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// MySQL connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "telegram_auth",
};

// Configuration
const config = {
  sessionExpireMinutes: parseInt(process.env.SESSION_EXPIRE_MINUTES) || 5,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  botUsername: process.env.BOT_USERNAME,
};

// Database initialization
async function initDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(20),
        is_registered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_key VARCHAR(255) UNIQUE NOT NULL,
        telegram_id BIGINT DEFAULT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_key (session_key),
        INDEX idx_telegram_id (telegram_id),
        INDEX idx_expires_at (expires_at)
      )
    `);

    await connection.end();
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    process.exit(1);
  }
}

// Auth sessions store (in-memory for active sessions)
const activeSessions = new Map();

// Generate auth key
function generateAuthKey() {
  return crypto.randomBytes(32).toString("hex");
}

// Clean expired sessions from database
async function cleanExpiredSessions() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "DELETE FROM auth_sessions WHERE expires_at < NOW()"
    );
    await connection.end();
  } catch (error) {
    console.error("Session cleanup error:", error);
  }
}

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Generate QR code / auth key
app.post("/api/auth/generate", async (req, res) => {
  try {
    const authKey = generateAuthKey();
    const expiresAt = new Date(
      Date.now() + config.sessionExpireMinutes * 60 * 1000
    );

    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "INSERT INTO auth_sessions (session_key, expires_at) VALUES (?, ?)",
      [authKey, expiresAt]
    );
    await connection.end();

    // Store in memory for quick access
    activeSessions.set(authKey, {
      status: "waiting",
      expiresAt,
      telegramId: null,
    });

    const botUrl = config.botUsername
      ? `https://t.me/${config.botUsername}?start=${authKey}`
      : `tg://bot_command?command=start&bot=${
          process.env.BOT_TOKEN.split(":")[0]
        }&data=${authKey}`;

    res.json({
      success: true,
      authKey,
      qrData: botUrl,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: config.sessionExpireMinutes * 60,
    });

    console.log(`🔑 Generated auth key: ${authKey.substring(0, 8)}...`);
  } catch (error) {
    console.error("Auth generation error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Check auth status
app.get("/api/auth/status/:key", async (req, res) => {
  try {
    const { key } = req.params;

    if (!key || key.length !== 64) {
      return res.status(400).json({
        success: false,
        error: "Invalid session key",
      });
    }

    const session = activeSessions.get(key);

    if (!session) {
      // Check database for session
      const connection = await mysql.createConnection(dbConfig);
      const [sessions] = await connection.execute(
        "SELECT * FROM auth_sessions WHERE session_key = ? AND expires_at > NOW()",
        [key]
      );
      await connection.end();

      if (sessions.length === 0) {
        return res.json({ success: false, status: "expired" });
      }

      const dbSession = sessions[0];
      if (dbSession.is_used && dbSession.telegram_id) {
        // Restore session to memory
        activeSessions.set(key, {
          status: "completed",
          expiresAt: new Date(dbSession.expires_at),
          telegramId: dbSession.telegram_id,
        });
      } else {
        return res.json({ success: true, status: "waiting" });
      }
    }

    const currentSession = activeSessions.get(key);

    if (currentSession.expiresAt < new Date()) {
      activeSessions.delete(key);
      return res.json({ success: false, status: "expired" });
    }

    if (currentSession.status === "completed" && currentSession.telegramId) {
      const connection = await mysql.createConnection(dbConfig);
      const [users] = await connection.execute(
        "SELECT * FROM users WHERE telegram_id = ?",
        [currentSession.telegramId]
      );
      await connection.end();

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const user = users[0];
      return res.json({
        success: true,
        status: "completed",
        user: {
          telegramId: user.telegram_id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          isRegistered: user.is_registered,
        },
      });
    }

    res.json({
      success: true,
      status: currentSession.status,
      expiresAt: currentSession.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Auth status error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Complete registration
app.post("/api/user/complete-registration", async (req, res) => {
  try {
    const { telegramId, additionalData = {} } = req.body;

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: "Telegram ID is required",
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE users SET is_registered = TRUE, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?",
      [telegramId]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    console.log(`✅ User registration completed: ${telegramId}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Registration completion error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Get user info
app.get("/api/user/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;

    const connection = await mysql.createConnection(dbConfig);
    const [users] = await connection.execute(
      "SELECT * FROM users WHERE telegram_id = ?",
      [telegramId]
    );
    await connection.end();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = users[0];
    res.json({
      success: true,
      user: {
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        isRegistered: user.is_registered,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Telegram Bot handlers
bot.command("start", async (ctx) => {
  const authKey = ctx.match;

  if (!authKey) {
    await ctx.reply(
      "👋 Привет! Я бот для аутентификации.\n\n" +
        "🔐 Для входа на сайт отсканируйте QR-код или перейдите по ссылке.",
      {
        reply_markup: new InlineKeyboard().text(
          "🌐 Перейти на сайт",
          config.frontendUrl
        ),
      }
    );
    return;
  }

  console.log(`🔍 Auth attempt with key: ${authKey.substring(0, 8)}...`);

  const session = activeSessions.get(authKey);
  if (!session) {
    // Check database
    const connection = await mysql.createConnection(dbConfig);
    const [sessions] = await connection.execute(
      "SELECT * FROM auth_sessions WHERE session_key = ? AND expires_at > NOW() AND is_used = FALSE",
      [authKey]
    );
    await connection.end();

    if (sessions.length === 0) {
      await ctx.reply(
        "❌ Сессия не найдена или истекла.\n\n" +
          "Пожалуйста, получите новый QR-код на сайте.",
        {
          reply_markup: new InlineKeyboard().text(
            "🌐 Перейти на сайт",
            config.frontendUrl
          ),
        }
      );
      return;
    }
  } else if (session.expiresAt < new Date()) {
    activeSessions.delete(authKey);
    await ctx.reply("❌ Сессия истекла. Пожалуйста, получите новый QR-код на сайте.");
    return;
  } else if (session.status !== "waiting") {
    await ctx.reply("❌ Эта сессия уже использована.");
    return;
  }

  // Update session
  activeSessions.set(authKey, {
    status: "contact_requested",
    expiresAt: session
      ? session.expiresAt
      : new Date(Date.now() + config.sessionExpireMinutes * 60 * 1000),
    telegramId: ctx.from.id,
  });

  // Request contact
  const keyboard = new Keyboard()
    .requestContact("📞 Отправить контакт")
    .resized()
    .oneTime();

  await ctx.reply(
    "✅ Подтвердите свой номер телефона для входа на сайт.\n\n" +
      "📱 Ваш номер телефона будет использован только для аутентификации и надежно защищен.\n\n" +
      "👇 Нажмите на кнопку ниже:",
    { reply_markup: keyboard }
  );

  console.log(`📱 Contact requested for user: ${ctx.from.id}`);
});

bot.on("message:contact", async (ctx) => {
  try {
    const contact = ctx.message.contact;
    const telegramId = ctx.from.id;

    if (contact.user_id !== telegramId) {
      await ctx.reply("❌ Пожалуйста, отправьте свой собственный контакт.");
      return;
    }

    console.log(`📞 Contact received from user: ${telegramId}`);

    // Find active session for this user
    let userSessionKey = null;
    for (const [key, session] of activeSessions.entries()) {
      if (
        session.telegramId === telegramId &&
        session.status === "contact_requested"
      ) {
        userSessionKey = key;
        break;
      }
    }

    if (!userSessionKey) {
      await ctx.reply(
        "❌ Активная сессия не найдена.\n\n" +
          "Пожалуйста, начните вход заново с сайта.",
        {
          reply_markup: new InlineKeyboard().text(
            "🌐 Перейти на сайт",
            config.frontendUrl
          ),
        }
      );
      return;
    }

    // Save user to database
    const connection = await mysql.createConnection(dbConfig);

    await connection.execute(
      `
      INSERT INTO users (telegram_id, username, first_name, last_name, phone) 
      VALUES (?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
        username = VALUES(username),
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        phone = VALUES(phone),
        updated_at = CURRENT_TIMESTAMP
    `,
      [
        telegramId,
        ctx.from.username || null,
        ctx.from.first_name || null,
        ctx.from.last_name || null,
        contact.phone_number,
      ]
    );

    // Update session in database
    await connection.execute(
      "UPDATE auth_sessions SET telegram_id = ?, is_used = TRUE WHERE session_key = ?",
      [telegramId, userSessionKey]
    );

    await connection.end();

    // Update session in memory
    const session = activeSessions.get(userSessionKey);
    session.status = "completed";

    // Success message with action button
    const keyboard = new InlineKeyboard().text(
      "🌐 Saytga qaytish",
      config.frontendUrl
    );

    await ctx.reply(
      "✅ Успешно подтверждено!\n\n" +
        "🎉 Вы успешно вошли в систему.\n" +
        "👇 Нажмите кнопку для возврата на сайт или вернитесь в браузер.",
      {
        reply_markup: keyboard,
        parse_mode: "HTML",
      }
    );

    console.log(`✅ Authentication completed for user: ${telegramId}`);
  } catch (error) {
    console.error("Contact handling error:", error);
    await ctx.reply(
      "❌ Произошла ошибка. Пожалуйста, попробуйте снова.\n\n" +
        "Если проблема повторится, получите новый QR-код на сайте."
    );
  }
});

bot.on("callback_query:data", async (ctx) => {
  await ctx.answerCallbackQuery();
});

// Error handling for bot
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`❌ Bot error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error("Grammy error:", e.description);
  } else if (e instanceof HttpError) {
    console.error("HTTP error:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

// Clean expired sessions periodically
setInterval(() => {
  const now = new Date();
  let cleanedCount = 0;

  for (const [key, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} expired sessions from memory`);
  }
}, 60000); // Every minute

// Clean database sessions every 10 minutes
setInterval(cleanExpiredSessions, 10 * 60 * 1000);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");

  try {
    await bot.stop();
    console.log("✅ Bot stopped");
  } catch (error) {
    console.error("❌ Error stopping bot:", error);
  }

  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    // Clean expired sessions on startup
    await cleanExpiredSessions();

    // Start web server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, async () => {
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);

      if (!process.env.BOT_TOKEN) {
        console.warn("⚠️  Warning: BOT_TOKEN not set in environment variables");
      }

      if (!config.botUsername) {
        console.warn(
          "⚠️  Warning: BOT_USERNAME not set. QR codes may not work properly"
        );
      }

      // Start bot after server is running
      await bot.start();
      console.log(`🤖 Telegram bot started successfully`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
