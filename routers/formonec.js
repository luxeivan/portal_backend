const express = require("express");
const router = express.Router();
const { getGetFields } = require("../services/onec/formonec");
const logger = require("../logger");

/**
 * @swagger
 * tags:
 *   - name: Formonec
 *     description: Маршруты для работы с формами в 1С
 */

/**
 * @swagger
 * /api/formonec/{key}:
 *   get:
 *     summary: Получение полей формы по ключу
 *     description: Получает поля формы на основе предоставленного ключа.
 *     tags: [Formonec]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Ключ для получения полей формы
 *     responses:
 *       200:
 *         description: Успешный ответ с полями формы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *       400:
 *         description: Ошибка в запросе
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/:key", async (req, res) => {
  try {
    const key = req.params.key;
    logger.info(`Запрос на получение полей с ключом: ${key}`); // Логируем информацию о запросе
    const fields = await getGetFields(key);
    res.json(fields);
  } catch (error) {
    logger.error("Ошибка при получении полей", { error: error.message }); // Логируем ошибку получения полей
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { getGetFields } = require("../services/onec/formonec");
// const logger = require("../logger");

// router.get("/:key", async (req, res) => {
//   try {
//     const key = req.params.key;
//     logger.info(`Запрос на получение полей с ключом: ${key}`); // Логируем информацию о запросе
//     const fields = await getGetFields(key);
//     res.json(fields);
//   } catch (error) {
//     logger.error("Ошибка при получении полей", { error: error.message }); // Логируем ошибку получения полей
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// module.exports = router;
