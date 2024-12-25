const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Error1C = sequelize.define(
  "Error1C",
  {
    code: {
      type: DataTypes.STRING, // Код ошибки 1С (можно сделать TEXT или другой тип при необходимости)
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT, // Текст ошибки
      allowNull: true,
    },
    timestamp: {
      // Храним время с миллисекундами (DATE(6) в MySQL позволяет до микросекунд)
      type: DataTypes.DATE(6),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "error_1c", // Название таблицы именно такое
    timestamps: false, // Если не используете поля createdAt/updatedAt
  }
);

module.exports = Error1C;
