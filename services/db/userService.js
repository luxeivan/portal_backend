const User = require("./models/User");

// Функция для добавления пользователя
async function addUser(email, phone, tempCode, attempts) {
  try {
    const newUser = await User.create({ email, phone, tempCode, attempts });
    console.log("Пользователь успешно добавлен:", email);
    return newUser
  } catch (error) {
    console.error(
      "Ошибка при добавлении пользователя:",
      error?.message || "unknown"
    );
  }
}
async function getAllUsers() {
  try {
    const allUsers = await User.findAll();
    console.log(allUsers)
    return allUsers
  } catch (error) {
    console.error(
      "Ошибка при получении пользователей:",
      error?.message || "unknown"
    );
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
    console.error(
      "Ошибка при удалении пользователя:",
      error?.message || "unknown"
    );
  }
}

module.exports = {
  addUser,
  deleteUserByEmail,
  getAllUsers
};
