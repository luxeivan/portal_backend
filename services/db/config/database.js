require("dotenv").config();
const { Sequelize } = require("sequelize");

const dbName = process.env.DB_NAME;
// console.log("dbName!!!!!!!!", dbName);
// console.log(process.env);


const sequelize = new Sequelize(process.env.DB_NAME, "public", "Gh_12345678", {
  host: "5.35.9.42",
  dialect: "mysql",
  port: 3306,
  logging: false, // Отключить логирование SQL запросов в консоль
});

module.exports = sequelize;
