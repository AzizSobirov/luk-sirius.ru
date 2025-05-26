const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { User, AuthSession } = require("../models");
const { Op } = require("sequelize");
const config = require("../config/app");

class AuthService {
  constructor() {
    this.activeSessions = new Map();
  }

  generateAuthKey() {
    return crypto.randomBytes(32).toString("hex");
  }

  async createAuthSession() {
    const authKey = this.generateAuthKey();
    const expiresAt = new Date(
      Date.now() + config.sessionExpireMinutes * 60 * 1000
    );

    await AuthSession.create({
      sessionKey: authKey,
      expiresAt,
    });

    // Store in memory for quick access
    this.activeSessions.set(authKey, {
      status: "waiting",
      expiresAt,
      telegramId: null,
    });

    return {
      authKey,
      expiresAt,
      expiresInSeconds: config.sessionExpireMinutes * 60,
    };
  }

  async getSessionStatus(sessionKey) {
    if (!sessionKey || sessionKey.length !== 64) {
      throw new Error("Invalid session key");
    }

    let session = this.activeSessions.get(sessionKey);

    if (!session) {
      const dbSession = await AuthSession.findOne({
        where: {
          sessionKey,
          expiresAt: { [Op.gt]: new Date() },
        },
      });

      if (!dbSession) {
        return { success: false, status: "expired" };
      }

      if (dbSession.isUsed && dbSession.telegramId) {
        this.activeSessions.set(sessionKey, {
          status: "completed",
          expiresAt: dbSession.expiresAt,
          telegramId: dbSession.telegramId,
        });
        session = this.activeSessions.get(sessionKey);
      } else {
        return { success: true, status: "waiting" };
      }
    }

    if (session.expiresAt < new Date()) {
      this.activeSessions.delete(sessionKey);
      return { success: false, status: "expired" };
    }

    if (session.status === "completed" && session.telegramId) {
      const user = await User.findOne({
        where: { telegramId: session.telegramId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return {
        success: true,
        status: "completed",
        token: session.token,
        user: {
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          isRegistered: user.isRegistered,
        },
      };
    }

    return {
      success: true,
      status: session.status,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  updateSessionStatus(sessionKey, status, telegramId = null, token = null) {
    const session = this.activeSessions.get(sessionKey);
    if (session) {
      session.status = status;
      if (telegramId) {
        session.telegramId = telegramId;
      }
      if (token) {
        session.token = token;
      }
    }
  }

  async cleanExpiredSessions() {
    try {
      await AuthSession.destroy({
        where: {
          expiresAt: { [Op.lt]: new Date() },
        },
      });

      // Clean memory sessions
      const now = new Date();
      let cleanedCount = 0;

      for (const [key, session] of this.activeSessions.entries()) {
        if (session.expiresAt < now) {
          this.activeSessions.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned ${cleanedCount} expired sessions from memory`);
      }
    } catch (error) {
      console.error("Session cleanup error:", error);
    }
  }

  getBotUrl(authKey) {
    return config.botUsername
      ? `https://t.me/${config.botUsername}?start=${authKey}`
      : `tg://bot_command?command=start&bot=${
          config.botToken.split(":")[0]
        }&data=${authKey}`;
  }

  generateToken(user) {
    return jwt.sign(
      {
        telegramId: user.telegramId,
        username: user.username,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );
  }

  async registerUser(userData) {
    const { telegramId } = userData;

    // Check if user exists
    let user = await User.findOne({ where: { telegramId } });

    if (!user) {
      user = await User.create({
        ...userData,
        isRegistered: true,
      });
    } else if (user.isRegistered) {
      throw new Error("User already exists");
    } else {
      await user.update({
        ...userData,
        isRegistered: true,
      });
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isRegistered: user.isRegistered,
      },
    };
  }
}

module.exports = new AuthService();
