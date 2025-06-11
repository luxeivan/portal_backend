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

/**
 * @swagger
 * /api/cabinet/claims:
 *   post:
 *     summary: Создать новую заявку
 *     tags: ["🔒 Claims"]
 *     security: [ bearerAuth: [] ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Произвольный JSON с полями заявки
 *             example:
 *               serviceKey: "CONNECTION"
 *               description: "Хочу подключиться к сети"
 *               files: [ "a1b2c3d4-e5f6-7890" ]
 *     responses:
 *       200:
 *         description: Заявка создана
 *       500:
 *         description: Ошибка при создании заявки
 */


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


/**
 * @swagger
 * /api/cabinet/claims:
 *   get:
 *     summary: Список заявок пользователя
 *     tags: ["🔒 Claims"]
 *     security: [ bearerAuth: [] ]
 *     responses:
 *       200:
 *         description: Массив заявок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: object }
 *       500:
 *         description: Ошибка при получении заявок
 */

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

/**
 * @swagger
 * /api/cabinet/claims/{key}:
 *   get:
 *     summary: Детали конкретной заявки
 *     tags: ["🔒 Claims"]
 *     security: [ bearerAuth: [] ]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         description: GUID заявки
 *     responses:
 *       200: { description: Заявка найдена }
 *       500: { description: Ошибка при получении заявки }
 */


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
