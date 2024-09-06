const sequelize = require("./config/database");
const { addUser, deleteUserByEmail } = require("./userService");
const Log = require('./models/Log'); // Импортируем модель Log

sequelize
  .sync({ force: false }) // Синхронизируем базу данных, force = false, чтобы не пересоздавать таблицы
  .then(async () => {
    console.log("База данных синхронизирована");

    // Пример записи лога в базу
    await Log.create({
      level: "info",
      message: "Тестовый лог для проверки",
    });

    // Добавляем пользователей
    await addUser("Райан12223@example.com", "0987654321", "5678", 0);

    // Удаляем пользователей по email
    // await deleteUserByEmail("user1@example.com");
    // await deleteUserByEmail("user2@example.com");
  })
  .catch((error) => {
    console.error("Ошибка синхронизации базы данных:", error);
  });


// const sequelize = require("./config/database");
// const { addUser, deleteUserByEmail } = require("./userService");

// sequelize
//   .sync({ force: false })
//   .then(async () => {
//     console.log("База данных синхронизирована");

//     // Добавляем пользователей
//     await addUser("Райан12223@example.com", "0987654321", "5678", 0);

//     // Удаляем пользователей по email
//     // await deleteUserByEmail("user1@example.com");
//     // await deleteUserByEmail("user2@example.com");
//   })
//   .catch((error) => {
//     console.error("Ошибка синхронизации базы данных:", error);
//   });
