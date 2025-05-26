module.exports = (sequelize, DataTypes) => {
  const AuthSession = sequelize.define(
    "AuthSession",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sessionKey: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: "session_key",
      },
      telegramId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: "telegram_id",
      },
      isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_used",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
      },
    },
    {
      tableName: "auth_sessions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ["session_key"],
        },
        {
          fields: ["telegram_id"],
        },
        {
          fields: ["expires_at"],
        },
      ],
    }
  );

  return AuthSession;
};
