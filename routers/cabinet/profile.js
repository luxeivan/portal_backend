const express = require("express");
const router = express.Router();
const { getUserById, updateUser } = require("../../services/onec/users");
const logger = require("../../logger");
const { getAllUsers } = require("../../services/db/userService");

router.get("/", async (req, res) => {
  try {
    // Предполагается, что userId получен из токена
    // const userId = req.session.founduser ? req.session.founduser.Ref_Key : null;
    const userId = req.userId;
    if (!userId) {
      logger.error("User ID is not defined");
      return res.status(400).json({ message: "User ID is required" });
    }

    logger.info(`Запрос на получение профиля пользователя с id: ${userId}`);
    const profile = await getUserById(userId); // Используем метод из 1С
    // console.log('profile',profile)

    res.json({
      firstname: profile.firstName,
      lastname: profile.lastName,
      email: profile.email,
      phone: profile.phone,
    });
    logger.info(`Профиль пользователя с id: ${userId} успешно получен`);
  } catch (error) {
    console.log("error", error.message);
    logger.error(
      `Ошибка при получении профиля пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});
router.post("/newpassword", async (req, res) => {
  const userId = req.userId;
  const password = req.body.password;
  if (!password) {
    logger.error("Password is not defined");
    return res.status(400).json({ message: "Password is required" });
  }
  if (!userId) {
    logger.error("User ID is not defined");
    return res.status(400).json({ message: "User ID is required" });
  }
  logger.info(`Запрос на смену пароля пользователя с id: ${userId}`);
  try {
    const updatedUser = await updateUser(userId, false, password);
    res.json(updateUser);
  } catch (error) {
    console.log("error", error.message);
    logger.error(
      `Ошибка при смене пароля пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});
router.post("/newphone", async (req, res) => {
  const userId = req.userId;
  const phone = req.body.phone;
  if (!phone) {
    logger.error("Phone is not defined");
    return res.status(400).json({ message: "Phone is required" });
  }
  if (!userId) {
    logger.error("User ID is not defined");
    return res.status(400).json({ message: "User ID is required" });
  }
  logger.info(`Запрос на смену пароля пользователя с id: ${userId}`);
  try {
    const updatedUser = await updateUser(userId, phone, false);
    res.json(updateUser);
  } catch (error) {
    console.log("error", error.message);
    logger.error(
      `Ошибка при смене пароля пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

router.get("/allusers", async (req, res) => {
  // console.log(getAllUsers())
  res.json(await getAllUsers())
})
module.exports = router;
