const sequelize = require("./config/database");
const { addUser } = require("./userService");
const Log = require("./models/Log");
const Error1C = require("./models/Error1C"); 

sequelize
  .sync({ force: false }) 
  .then(async () => {
    console.log("База данных синхронизирована");

    // Пример записи лога в existing Log
    await Log.create({
      level: "info",
      message: "Тестовый лог для проверки",
    });

    // Пример записи пользователя
    await addUser("Райан12223@example.com", "0987654321", "5678", 0);

    // Пример записи новой ошибки в таблицу error_1c
    await Error1C.create({
      code: "ERR_42",
      message: "Это тестовая ошибка из 1С",
      // timestamp не передаём, оно само DataTypes.NOW
    });

    console.log("Таблица error_1c: ошибка успешно записана!");
  })
  .catch((error) => {
    console.error("Ошибка синхронизации базы данных:", error);
  });
