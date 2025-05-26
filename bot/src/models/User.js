module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      telegramId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        field: "telegram_id",
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      firstName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "first_name",
      },
      lastName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "last_name",
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      isRegistered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_registered",
      },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["telegram_id"],
        },
      ],
    }
  );

  return User;
};
