const sequelize = require("./config/database");
const { addUser, deleteUserByEmail } = require("./userService");

sequelize
  .sync({ force: false })
  .then(async () => {
    console.log("База данных синхронизирована");

    // Добавляем пользователей
    await addUser("Райан123@example.com", "0987654321", "5678", 0);

    // Удаляем пользователей по email
    // await deleteUserByEmail("user1@example.com");
    // await deleteUserByEmail("user2@example.com");
  })
  .catch((error) => {
    console.error("Ошибка синхронизации базы данных:", error);
  });
