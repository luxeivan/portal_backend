const express = require("express");
const router = express.Router();
const { getUserById, updateUser } = require("../../services/onec/users"); // Изменен импорт
const logger = require("../../logger");

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
    console.log('error', error.message)
    logger.error(`Ошибка при получении профиля пользователя с id: ${userId}. Ошибка: ${error.message}`);
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
    const updatedUser = await updateUser(userId, false, password)
    res.json(updateUser)
  } catch (error) {
    console.log('error', error.message)
    logger.error(`Ошибка при смене пароля пользователя с id: ${userId}. Ошибка: ${error.message}`);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
})
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
    const updatedUser = await updateUser(userId, phone, false)
    res.json(updateUser)
  } catch (error) {
    console.log('error', error.message)
    logger.error(`Ошибка при смене пароля пользователя с id: ${userId}. Ошибка: ${error.message}`);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
})
module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { getUserById } = require("../../services/strapi");

// const logger = require("../../logger");

// /**
//  * @swagger
//  * tags:
//  *   - name: Profile
//  *     description: Маршруты для управления профилем пользователя
//  */

// /**
//  * @swagger
//  * /api/cabinet/profile:
//  *   get:
//  *     summary: Получение профиля пользователя
//  *     description: Возвращает данные профиля пользователя по его ID.
//  *     tags:
//  *       - Profile
//  *     responses:
//  *       200:
//  *         description: Профиль пользователя успешно получен
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 firstname:
//  *                   type: string
//  *                 lastname:
//  *                   type: string
//  *                 email:
//  *                   type: string
//  *                   format: email
//  *                 phone:
//  *                   type: string
//  *       500:
//  *         description: Внутренняя ошибка сервера
//  */

// router.get("/", async (req, res) => {
//   try {
//     const userId = req.userId || false;
//     logger.info(`Запрос на получение профиля пользователя с id: ${userId}`);
//     const profile = await getUserById(userId);
//     res.json({
//       firstname: profile.attributes.firstname,
//       lastname: profile.attributes.lastname,
//       email: profile.attributes.email,
//       phone: profile.attributes.phone,
//     });
//     logger.info(`Профиль пользователя с id: ${userId} успешно получен`);
//   } catch (error) {
//     logger.error(
//       `Ошибка при получении профиля пользователя с id: ${userId}. Ошибка: ${error.message}`
//     );
//     res.status(500).json({ message: "Внутренняя ошибка сервера" });
//   }
// });

// module.exports = router;
