const express = require("express");
const router = express.Router();
const { getUserById } = require("../../services/strapi");

const logger = require("../../logger");

router.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    logger.info(`Запрос на получение профиля пользователя с id: ${userId}`);
    const profile = await getUserById(userId);
    res.json({
      firstname: profile.attributes.firstname,
      lastname: profile.attributes.lastname,
      email: profile.attributes.email,
      phone: profile.attributes.phone,
    });
    logger.info(`Профиль пользователя с id: ${userId} успешно получен`);
  } catch (error) {
    logger.error(
      `Ошибка при получении профиля пользователя с id: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

module.exports = router;
