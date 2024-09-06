require("dotenv").config();
const { Sequelize } = require("sequelize");

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;
// console.log("dbName!!!!!!!!", dbName);
// console.log(process.env);


const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: "mysql",
  port: 3306,
  logging: false, // Отключить логирование SQL запросов в консоль
});

module.exports = sequelize;
