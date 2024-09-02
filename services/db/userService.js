const User = require("./models/User");

// Функция для добавления пользователя
async function addUser(email, phone, tempCode, attempts) {
  try {
    await User.create({ email, phone, tempCode, attempts });
    console.log("Пользователь успешно добавлен:", email);
  } catch (error) {
    console.error("Ошибка при добавлении пользователя:", error);
  }
}

// Функция для удаления пользователя по email
async function deleteUserByEmail(email) {
  try {
    await User.destroy({
      where: { email },
    });
    console.log("Пользователь успешно удален:", email);
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);
  }
}

module.exports = {
  addUser,
  deleteUserByEmail,
};
