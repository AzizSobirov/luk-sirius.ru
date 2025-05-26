const { Bot, GrammyError, HttpError } = require("grammy");
const config = require("../config/app");
const handlers = require("./handlers");

class TelegramBot {
  constructor() {
    this.bot = new Bot(config.botToken);
    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupHandlers() {
    this.bot.command("start", handlers.handleStart.bind(handlers));
    this.bot.on("message:contact", handlers.handleContact.bind(handlers));
    this.bot.on(
      "callback_query:data",
      handlers.handleCallbackQuery.bind(handlers)
    );
  }

  setupErrorHandling() {
    this.bot.catch((err) => {
      const ctx = err.ctx;
      console.error(
        `❌ Bot error while handling update ${ctx.update.update_id}:`
      );
      const e = err.error;

      if (e instanceof GrammyError) {
        console.error("Grammy error:", e.description);
      } else if (e instanceof HttpError) {
        console.error("HTTP error:", e);
      } else {
        console.error("Unknown error:", e);
      }
    });
  }

  async start() {
    await this.bot.start();
    console.log("🤖 Telegram bot started successfully");
  }

  async stop() {
    await this.bot.stop();
    console.log("✅ Bot stopped");
  }
}

module.exports = new TelegramBot();
