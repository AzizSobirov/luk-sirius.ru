const { User } = require("../models");

class UserService {
  async createOrUpdateUser(userData) {
    const { telegramId, username, firstName, lastName, phone } = userData;

    const [user, created] = await User.upsert({
      telegramId,
      username,
      firstName,
      lastName,
      phone,
    });

    return { user, created };
  }

  async getUserById(telegramId) {
    const user = await User.findOne({
      where: { telegramId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async completeRegistration(telegramId, additionalData = {}) {
    const [updatedRowsCount] = await User.update(
      {
        isRegistered: true,
        ...additionalData,
      },
      {
        where: { telegramId },
      }
    );

    if (updatedRowsCount === 0) {
      throw new Error("User not found");
    }

    return true;
  }
}

module.exports = new UserService();
