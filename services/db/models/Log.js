const { DataTypes } = require("sequelize");
const db = require("../config/database"); 

const Log = db.define(
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
      type: DataTypes.DATE,
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
