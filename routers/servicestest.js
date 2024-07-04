const express = require("express");
const router = express.Router();
const {
  getServicesByKey,
  getServiceItemByKey,
} = require("../services/onec/servicestest");
const logger = require("../logger");

router.get("/", async (req, res) => {
  logger.info("Получен запрос на получение всех сервисов");

  try {
    const services = await getServicesByKey();
    logger.info("Все сервисы успешно получены");
    res.json(services);
  } catch (error) {
    logger.error(`Ошибка при получении всех сервисов: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении всех сервисов",
      error: error.message,
    });
  }
});

router.get("/:key", async (req, res) => {
  const key = req.params.key;
  logger.info(`Получен запрос на получение сервиса по ключу: ${key}`);

  try {
    const service = await getServicesByKey(key);
    logger.info(`Сервис по ключу ${key} успешно получен`);
    res.json(service);
  } catch (error) {
    logger.error(
      `Ошибка при получении сервиса по ключу ${key}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении сервиса",
      error: error.message,
    });
  }
});

router.get("/item/:key", async (req, res) => {
  const key = req.params.key;
  logger.info(`Получен запрос на получение элемента сервиса по ключу: ${key}`);

  try {
    const services = await getServiceItemByKey(key);
    logger.info(`Элемент сервиса по ключу ${key} успешно получен`);
    res.json(services);
  } catch (error) {
    logger.error(
      `Ошибка при получении элемента сервиса по ключу ${key}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении элемента сервиса",
      error: error.message,
    });
  }
});

module.exports = router;
