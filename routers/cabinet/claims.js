const express = require("express");
const router = express.Router();
const {
  createClaim,
  getClaims,
  getClaimItem,
} = require("../../services/onec/claims");
const logger = require("../../logger");

/**
 * @swagger
 * tags:
 *   - name: Claims
 *     description: Маршруты для работы с заявками пользователей в личном кабинете
 */

/**
 * @swagger
 * /api/cabinet/claims:
 *   post:
 *     summary: Создание новой заявки
 *     description: Создает новую заявку для текущего пользователя.
 *     tags:
 *       - Claims
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название заявки
 *               description:
 *                 type: string
 *                 description: Описание заявки
 *     responses:
 *       200:
 *         description: Заявка успешно создана
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
    const newClaim = await createClaim(data, userId);
    logger.info(`Заявка успешно создана для пользователя с ID: ${userId}`);
    res.json(newClaim);
  } catch (error) {
    console.log(error);
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
 *     summary: Получение всех заявок пользователя
 *     description: Возвращает список всех заявок текущего пользователя.
 *     tags:
 *       - Claims
 *     responses:
 *       200:
 *         description: Успешное получение списка заявок
 *       500:
 *         description: Ошибка при получении заявок
 */
router.get("/", async (req, res) => {
  const userId = req.userId;
  logger.info(
    `Получен запрос на получение заявок пользователя с ID: ${userId}`
  );

  try {
    const claims = await getClaims(userId);
    logger.info(`Заявки успешно получены для пользователя с ID: ${userId}`);
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
 *     summary: Получение заявки по ключу
 *     description: Возвращает информацию о конкретной заявке по её ключу.
 *     tags:
 *       - Claims
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Ключ заявки
 *     responses:
 *       200:
 *         description: Заявка успешно получена
 *       500:
 *         description: Ошибка при получении заявки
 */
router.get("/:key", async (req, res) => {
  const userId = req.userId;
  const key = req.params.key;
  logger.info(`Получен запрос на получение заявки с ключом: ${key}`);

  try {
    const claim = await getClaimItem(userId, key);
    logger.info(`Заявка с ключом ${key} успешно получена`);
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

// const express = require("express");
// const router = express.Router();
// const { createClaim, getClaims, getClaimItem } = require("../../services/onec/claims");
// const logger = require("../../logger");

// router.post("/", async (req, res) => {
//   const userId = req.userId;
//   const data = req.body;
//   logger.info(
//     `Получен запрос на создание заявки от пользователя с ID: ${userId}`
//   );

//   try {
//     const newClaim = await createClaim(data, userId);
//     logger.info(`Заявка успешно создана для пользователя с ID: ${userId}`);
//     res.json(newClaim);
//   } catch (error) {
//     console.log(error)
//     logger.error(
//       `Ошибка при создании заявки для пользователя с ID ${userId}: ${error.message}`
//     );
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при создании заявки",
//       error: error,
//     });
//   }
// });

// router.get("/", async (req, res) => {
//   const userId = req.userId;
//   logger.info(
//     `Получен запрос на получение заявок пользователя с ID: ${userId}`
//   );

//   try {
//     const claims = await getClaims(userId);
//     logger.info(`Заявки успешно получены для пользователя с ID: ${userId}`);
//     res.json(claims);
//   } catch (error) {
//     logger.error(
//       `Ошибка при получении заявок для пользователя с ID ${userId}: ${error.message}`
//     );
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при получении заявок",
//       error: error.message,
//     });
//   }
// });

// router.get("/:key", async (req, res) => {
//   const userId = req.userId;
//   const key = req.params.key;
//   logger.info(`Получен запрос на получение заявки с ключом: ${key}`);

//   try {
//     const claim = await getClaimItem(userId,key);
//     logger.info(`Заявка с ключом ${key} успешно получена`);
//     res.json(claim);
//   } catch (error) {
//     logger.error(
//       `Ошибка при получении заявки с ключом ${key}: ${error.message}`
//     );
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при получении заявки",
//       error: error.message,
//     });
//   }
// });

// module.exports = router;
