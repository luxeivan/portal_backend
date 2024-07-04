const express = require("express");
const router = express.Router();
const {
  getServicesByKey,
  getServiceItemByKey,
} = require("../services/onec/services");
const logger = require("../logger");

router.get("/", async (req, res) => {
  logger.info("Получен запрос на получение сервисов");

  try {
    // const userId = req.userId
    //console.log(userData)
    const services = await getServicesByKey();
    logger.info("Сервисы успешно получены");
    res.json(services);
  } catch (error) {
    logger.error(`Ошибка при получении сервисов: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении сервисов",
      error: error.message,
    });
  }
});

router.get("/:key", async (req, res) => {
  logger.info(
    `Получен запрос на получение сервиса с ключом: ${req.params.key}`
  );

  try {
    const key = req.params.key;
    const service = await getServicesByKey(key);
    logger.info(`Сервис с ключом ${key} успешно получен`);
    res.json(service);
  } catch (error) {
    logger.error(
      `Ошибка при получении сервиса с ключом ${req.params.key}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении сервиса",
      error: error.message,
    });
  }
});

router.get("/item/:key", async (req, res) => {
  logger.info(
    `Получен запрос на получение элемента сервиса с ключом: ${req.params.key}`
  );

  try {
    const key = req.params.key;
    const services = await getServiceItemByKey(key);
    logger.info(`Элемент сервиса с ключом ${key} успешно получен`);
    res.json(services);
  } catch (error) {
    logger.error(
      `Ошибка при получении элемента сервиса с ключом ${req.params.key}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении элемента сервиса",
      error: error.message,
    });
  }
});

module.exports = router;
