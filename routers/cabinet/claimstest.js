const express = require("express");
const router = express.Router();
const { createClaim, getClaims } = require("../../services/onec/claimtest");
const logger = require("../../logger");

router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    const data = req.body;
    logger.info(`Получен запрос на создание жалобы от пользователя: ${userId}`);

    const newClaim = await createClaim(data, userId);
    res.json(newClaim);

    logger.info(`Жалоба успешно создана для пользователя: ${userId}`);
  } catch (error) {
    logger.error(
      `Ошибка при создании жалобы для пользователя: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({
      message: "Внутренняя ошибка сервера",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    logger.info(`Получен запрос на получение услуг от пользователя: ${userId}`);

    const services = await getClaims(userId);
    res.json(services);

    logger.info(`Услуги успешно получены для пользователя: ${userId}`);
  } catch (error) {
    logger.error(
      `Ошибка при получении услуг для пользователя: ${userId}. Ошибка: ${error.message}`
    );
    res.status(500).json({
      message: "Внутренняя ошибка сервера",
    });
  }
});

router.get("/:key", async (req, res) => {
  try {
    const key = req.params.key;
    logger.info(`Получен запрос на получение услуги с ключом: ${key}`);

    const service = await getServicesByKey(key);
    res.json(service);

    logger.info(`Услуга с ключом ${key} успешно получена`);
  } catch (error) {
    logger.error(
      `Ошибка при получении услуги с ключом: ${key}. Ошибка: ${error.message}`
    );
    res.status(500).json({
      message: "Внутренняя ошибка сервера",
    });
  }
});

router.get("/item/:key", async (req, res) => {
  try {
    const key = req.params.key;
    logger.info(`Получен запрос на получение элемента услуги с ключом: ${key}`);

    const services = await getServiceItemByKey(key);
    res.json(services);

    logger.info(`Элемент услуги с ключом ${key} успешно получен`);
  } catch (error) {
    logger.error(
      `Ошибка при получении элемента услуги с ключом: ${key}. Ошибка: ${error.message}`
    );
    res.status(500).json({
      message: "Внутренняя ошибка сервера",
    });
  }
});

module.exports = router;
