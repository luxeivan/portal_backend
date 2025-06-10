const express = require("express");
const router = express.Router();
const {
  createClaim,
  createNewClaim,
  getClaims,
  getClaimItem,
  createNewClaim1,
} = require("../../services/onec/claims");
const logger = require("../../logger");


router.post("/", async (req, res) => {
  const userId = req.userId;
  const data = req.body;
  logger.info(
    `Получен запрос на создание заявки от пользователя с ID: ${userId}`
  );

  try {
    const newClaim = await createNewClaim1(data, userId);
    logger.info(`Заявка успешно создана для пользователя с ID: ${userId}`);
    res.json(newClaim);
  } catch (error) {
    // console.log(error);
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
  // logger.info(
  //   `Получен запрос на получение заявок пользователя с ID: ${userId}`
  // );

  try {
    const claims = await getClaims(userId);
    // logger.info(`Заявки успешно получены для пользователя с ID: ${userId}`);
    res.json(claims);
  } catch (error) {
    logger.error(
      `Ошибка при получении заявок для пользователя с ID ${userId}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении заявок",
      error: error.message,
    });
  }
});


router.get("/:key", async (req, res) => {
  const userId = req.userId;
  const key = req.params.key;
  // logger.info(`Получен запрос на получение заявки с ключом: ${key}`);

  try {
    const claim = await getClaimItem(userId, key);
    // logger.info(`Заявка с ключом ${key} успешно получена`);
    res.json(claim);
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

module.exports = router;
