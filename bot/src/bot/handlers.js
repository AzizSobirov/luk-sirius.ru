const { Keyboard, InlineKeyboard } = require("grammy");
const AuthService = require("../services/AuthService");
const UserService = require("../services/UserService");
const { AuthSession } = require("../models");
const config = require("../config/app");

class BotHandlers {
  async handleStart(ctx) {
    const authKey = ctx.match;

    if (!authKey) {
      await ctx.reply(
        "👋 Привет! Я бот для аутентификации.\n\n" +
          "🔐 Для входа на сайт отсканируйте QR-код или перейдите по ссылке.",
        {
          reply_markup: new InlineKeyboard().url(
            "🌐 Перейти на сайт",
            config.frontendUrl
          ),
        }
      );
      return;
    }

    console.log(`🔍 Auth attempt with key: ${authKey.substring(0, 8)}...`);

    const session = AuthService.activeSessions.get(authKey);
    if (!session) {
      const dbSession = await AuthSession.findOne({
        where: {
          sessionKey: authKey,
          expiresAt: { [require("sequelize").Op.gt]: new Date() },
          isUsed: false,
        },
      });

      if (!dbSession) {
        await ctx.reply(
          "❌ Сессия не найдена или истекла.\n\n" +
            "Пожалуйста, получите новый QR-код на сайте.",
          {
            reply_markup: new InlineKeyboard().url(
              "🌐 Перейти на сайт",
              config.frontendUrl
            ),
          }
        );
        return;
      }
    } else if (session.expiresAt < new Date()) {
      AuthService.activeSessions.delete(authKey);
      await ctx.reply(
        "❌ Сессия истекла. Пожалуйста, получите новый QR-код на сайте."
      );
      return;
    } else if (session.status !== "waiting") {
      await ctx.reply("❌ Эта сессия уже использована.");
      return;
    }

    // Update session
    AuthService.updateSessionStatus(authKey, "contact_requested", ctx.from.id);

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
  }

  async handleContact(ctx) {
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
      for (const [key, session] of AuthService.activeSessions.entries()) {
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
            reply_markup: new InlineKeyboard().url(
              "🌐 Перейти на сайт",
              config.frontendUrl
            ),
          }
        );
        return;
      }

      // Save user to database
      await UserService.createOrUpdateUser({
        telegramId,
        username: ctx.from.username || null,
        firstName: ctx.from.first_name || null,
        lastName: ctx.from.last_name || null,
        phone: contact.phone_number,
      });

      const user = await UserService.getUserById(telegramId);
      const token = AuthService.generateToken(user);

      // Update session in database
      await AuthSession.update(
        { telegramId, isUsed: true },
        { where: { sessionKey: userSessionKey } }
      );

      // Update session in memory with token
      AuthService.updateSessionStatus(userSessionKey, "completed", telegramId, token);

      // Success message with action button
      const keyboard = new InlineKeyboard().url(
        "🌐 Вернуться на сайт",
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
  }

  async handleCallbackQuery(ctx) {
    await ctx.answerCallbackQuery();
  }
}

module.exports = new BotHandlers();
