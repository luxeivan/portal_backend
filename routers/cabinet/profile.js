const express = require("express");
const router = express.Router();
const { getUserById, updateUser } = require("../../services/onec/users");
const logger = require("../../logger");

/**
 * @swagger
 * /api/cabinet/profile:
 *   get:
 *     summary: Получить текущий профиль
 *     description: >
 *       🔒 Требуется JWT в заголовке
 *       `Authorization: Bearer <token>`
 *     tags: ["🔒 Profile"]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firstname:
 *                   type: string
 *                   example: Иван
 *                 lastname:
 *                   type: string
 *                   example: Иванов
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 phone:
 *                   type: string
 *                   example: "+7 916 123-45-67"
 *                 dateСreate:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-01T10:15:30Z"
 *       401:
 *         description: JWT отсутствует или невалиден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

router.get("/", async (req, res) => {
  try {
    // Предполагается, что userId получен из токена
    // const userId = req.session.founduser ? req.session.founduser.Ref_Key : null;
    const userId = req.userId;
    if (!userId) {
      logger.error("User ID is not defined");
      return res.status(400).json({ message: "User ID is required" });
    }

    // logger.info(`Запрос на получение профиля пользователя с id: ${userId}`);
    const profile = await getUserById(userId); // Используем метод из 1С
    // console.log("profile", profile);

    res.json({
      firstname: profile.firstName,
      lastname: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      dateСreate: profile.dateСreate,
    });
    // logger.info(`Профиль пользователя с id: ${userId} успешно получен`);
  } catch (error) {
    console.log("error", error.message);
    logger.error(
      `Ошибка при получении профиля пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

/**
 * @swagger
 * /api/cabinet/profile/newpassword:
 *   post:
 *     summary: Сменить пароль
 *     tags: ["🔒 Profile"]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 example: S0m3Str0ngPa$$
 *     responses:
 *       200:
 *         description: Пароль обновлён
 *       400:
 *         description: Пароль не передан
 *       401:
 *         description: JWT невалиден
 *       500:
 *         description: Внутренняя ошибка сервера
 */


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
  // logger.info(`Запрос на смену пароля пользователя с id: ${userId}`);
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

/**
 * @swagger
 * /api/cabinet/profile/newphone:
 *   post:
 *     summary: Обновить номер телефона
 *     tags: ["🔒 Profile"]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+7 926 000-00-00"
 *     responses:
 *       200:
 *         description: Телефон обновлён
 *       400:
 *         description: Телефон не передан
 *       401:
 *         description: JWT невалиден
 *       500:
 *         description: Внутренняя ошибка сервера
 */

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
  // logger.info(`Запрос на смену пароля пользователя с id: ${userId}`);
  try {
    const updatedUser = await updateUser(userId, phone, false);
    res.json(updatedUser);
  } catch (error) {
    console.log("error", error.message);
    logger.error(
      `Ошибка при смене пароля пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

module.exports = router;
