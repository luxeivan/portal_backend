const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Log = sequelize.define(
  "Log",
  {
    level: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.TIME,
      defaultValue: DataTypes.NOW,
    },
    stack: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "logs",
    timestamps: false,
  }
);

module.exports = Log;
