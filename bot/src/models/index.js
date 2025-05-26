const { Sequelize } = require("sequelize");
const config = require("../config/database.js");
const appConfig = require("../config/app.js");

const sequelize = new Sequelize(
  config[appConfig.env].database,
  config[appConfig.env].username,
  config[appConfig.env].password,
  {
    ...config[appConfig.env],
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

// Import models
const User = require("./User")(sequelize, Sequelize.DataTypes);
const AuthSession = require("./AuthSession")(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(AuthSession, {
  foreignKey: "telegramId",
  sourceKey: "telegramId",
});
AuthSession.belongsTo(User, {
  foreignKey: "telegramId",
  targetKey: "telegramId",
});

const db = {
  sequelize,
  Sequelize,
  User,
  AuthSession,
};

module.exports = db;
