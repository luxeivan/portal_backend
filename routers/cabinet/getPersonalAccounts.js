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
 *     summary: Список лицевых счётов пользователя
 *     tags: ["🔒 PersonalAccounts"]
 *     security: [ bearerAuth: [] ]
 *     responses:
 *       200:
 *         description: Лицевые счёта найдены
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: object }
 *       500: { description: Ошибка при получении данных }
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
 *     summary: Детали конкретного лицевого счёта
 *     tags: ["🔒 PersonalAccounts"]
 *     security: [ bearerAuth: [] ]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         description: GUID лицевого счёта
 *     responses:
 *       200: { description: Счёт найден }
 *       500: { description: Ошибка при получении данных }
*/
/**
 * @swagger
 * /api/cabinet/personalAccounts/{key}/claims:
 *   get:
 *     summary: Заявки, связанные с лицевым счётом
 *     tags: ["🔒 PersonalAccounts"]
 *     security: [ bearerAuth: [] ]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Заявки найдены
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: object }
 *       500: { description: Ошибка при получении данных }
 */

router.get("/:key/claims", async (req, res) => {
  const userId = req.userId;
  const page = req.query.page
  const size = req.query.size
  const key = encodeURIComponent(req.params.key);
  // logger.info(
  //   `Получен запрос на получение личных кабинетов пользователя с ID: ${userId}`
  // );
  // console.log("claims");

  try {
    const сlaimsByPersonalAccount = await getClaimsByPersonalAccount(
      userId,
      key,
      page,
      size
    );
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

router.get("/:key", async (req, res) => {
  const userId = req.userId;
  const key = encodeURIComponent(req.params.key);
  // logger.info(`Получен запрос на получение заявки с ключом: ${key}`);
  // console.log("key");

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
});

module.exports = router;
