const express = require("express");
const router = express.Router();
const { createClaim, getClaims } = require("../../services/onec/claims");
const logger = require("../../logger");

router.post("/", async (req, res) => {
  const userId = req.userId;
  const data = req.body;
  logger.info(
    `Получен запрос на создание претензии от пользователя с ID: ${userId}`
  );

  try {
    const newClaim = await createClaim(data, userId);
    logger.info(`Претензия успешно создана для пользователя с ID: ${userId}`);
    res.json(newClaim);
  } catch (error) {
    logger.error(
      `Ошибка при создании претензии для пользователя с ID ${userId}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при создании претензии",
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  const userId = req.userId;
  logger.info(
    `Получен запрос на получение претензий пользователя с ID: ${userId}`
  );

  try {
    const services = await getClaims(userId);
    logger.info(`Претензии успешно получены для пользователя с ID: ${userId}`);
    res.json(services);
  } catch (error) {
    logger.error(
      `Ошибка при получении претензий для пользователя с ID ${userId}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении претензий",
      error: error.message,
    });
  }
});

router.get("/:key", async (req, res) => {
  const key = req.params.key;
  logger.info(`Получен запрос на получение услуги с ключом: ${key}`);

  try {
    const service = await getServicesByKey(key);
    logger.info(`Услуга с ключом ${key} успешно получена`);
    res.json(service);
  } catch (error) {
    logger.error(
      `Ошибка при получении услуги с ключом ${key}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении услуги",
      error: error.message,
    });
  }
});

router.get("/item/:key", async (req, res) => {
  const key = req.params.key;
  logger.info(`Получен запрос на получение элемента услуги с ключом: ${key}`);

  try {
    const services = await getServiceItemByKey(key);
    logger.info(`Элемент услуги с ключом ${key} успешно получен`);
    res.json(services);
  } catch (error) {
    logger.error(
      `Ошибка при получении элемента услуги с ключом ${key}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении элемента услуги",
      error: error.message,
    });
  }
});

module.exports = router;
