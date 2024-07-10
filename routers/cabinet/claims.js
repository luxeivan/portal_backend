const express = require("express");
const router = express.Router();
const { createClaim, getClaims } = require("../../services/onec/claims");
const logger = require("../../logger");

router.post("/", async (req, res) => {
  const userId = req.userId;
  const data = req.body;
  logger.info(
    `Получен запрос на создание заявки от пользователя с ID: ${userId}`
  );

  try {
    const newClaim = await createClaim(data, userId);
    logger.info(`Заявка успешно создана для пользователя с ID: ${userId}`);
    res.json(newClaim);
  } catch (error) {
    logger.error(
      `Ошибка при создании заявки для пользователя с ID ${userId}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при создании заявки",
      error: error,
    });
  }
});

router.get("/", async (req, res) => {
  const userId = req.userId;
  logger.info(
    `Получен запрос на получение заявки пользователя с ID: ${userId}`
  );

  try {
    const services = await getClaims(userId);
    logger.info(`Заявки успешно получены для пользователя с ID: ${userId}`);
    res.json(services);
  } catch (error) {
    logger.error(
      `Ошибка при получении заявки для пользователя с ID ${userId}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении заявки",
      error: error.message,
    });
  }
});

router.get("/:key", async (req, res) => {
  const key = req.params.key;
  logger.info(`Получен запрос на получение заявки с ключом: ${key}`);

  try {
    const service = await getServicesByKey(key);
    logger.info(`Заявка с ключом ${key} успешно получена`);
    res.json(service);
  } catch (error) {
    logger.error(
      `Ошибка при получении заявки с ключом ${key}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении заявки",
      error: error.message,
    });
  }
});

router.get("/item/:key", async (req, res) => {
  const key = req.params.key;
  logger.info(`Получен запрос на получение элемента заявки с ключом: ${key}`);

  try {
    const services = await getServiceItemByKey(key);
    logger.info(`Элемент заявки с ключом ${key} успешно получен`);
    res.json(services);
  } catch (error) {
    logger.error(
      `Ошибка при получении элемента заявки с ключом ${key}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении элемента заявки",
      error: error.message,
    });
  }
});

module.exports = router;
