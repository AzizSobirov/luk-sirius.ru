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

    return {
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isRegistered: user.isRegistered,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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
