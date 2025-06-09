const express = require("express");
const router = express.Router();
const {
  getPersonalAccounts,
  getPersonalAccountItem,
  getClaimsByPersonalAccount,
} = require("../../services/onec/personalAccounts");
const logger = require("../../logger");

/**
 * @swagger
 * /api/cabinet/personalAccounts:
 *   get:
 *     summary: Получение всех личных кабинетов пользователя
 *     description: Возвращает список всех личных кабинетов текущего пользователя.
 *     tags:
 *       - PersonalAccounts
 *     responses:
 *       200:
 *         description: Успешное получение списка личных кабинетов
 *       500:
 *         description: Ошибка при получении личных кабинетов
 */
router.get("/", async (req, res) => {
  const userId = req.userId;
  // logger.info(
  //   `Получен запрос на получение личных кабинетов пользователя с ID: ${userId}`
  // );

  try {
    const personalAccounts = await getPersonalAccounts(userId);
    // logger.info(`Заявки успешно получены для пользователя с ID: ${userId}`);
    res.json(personalAccounts);
  } catch (error) {
    logger.error(
      `Ошибка при получении личных кабинетов для пользователя с ID ${userId}: ${error.message}`
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении личных кабинетов",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/cabinet/personalAccounts/{key}:
 *   get:
 *     summary: Получение личных кабинетов по ключу
 *     description: Возвращает информацию о конкретном личном кабинете по его ключу.
 *     tags:
 *       - Claims
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Ключ личного кабинета
 *     responses:
 *       200:
 *         description: Личный кабинет успешно получен
 *       500:
 *         description: Ошибка при получении личного кабинета
 */
router.get("/:key", async (req, res) => {
  const userId = req.userId;
  const key = req.params.key;
  // logger.info(`Получен запрос на получение заявки с ключом: ${key}`);

  try {
    const personalAccount = await getPersonalAccountItem(userId, key);
    // logger.info(`Заявка с ключом ${key} успешно получена`);
    res.json(personalAccount);
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
  /**
 * @swagger
 * /api/cabinet/personalAccounts/сlaims:
 *   get:
 *     summary: Получение всех заявок по личному кабинету
 *     description: Возвращает список всех личных кабинетов текущего пользователя.
 *     tags:
 *       - PersonalAccounts
 *     responses:
 *       200:
 *         description: Успешное получение заявок по личному кабинету
 *       500:
 *         description: Ошибка при получении заявок по личному кабинету
 */
  router.get("/:key/claims", async (req, res) => {
    const userId = req.userId;
    const key = req.params.key;
    // logger.info(
    //   `Получен запрос на получение личных кабинетов пользователя с ID: ${userId}`
    // );

    try {
      const сlaimsByPersonalAccount = await getClaimsByPersonalAccount(userId,key);
      // logger.info(`Заявки успешно получены для пользователя с ID: ${userId}`);
      res.json(сlaimsByPersonalAccount);
    } catch (error) {
      logger.error(
        `Ошибка при получении заявок по личному кабинету с ID ${userId}: ${error.message}`
      );
      res.status(500).json({
        status: "error",
        message: "Ошибка при получении заявок по личному кабинету",
        error: error.message,
      });
    }
  });
});

module.exports = router;
