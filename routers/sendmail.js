const express = require("express");
const router = express.Router();
const sendCodeToMail = require("../services/sendCodeToMail");
const logger = require("../logger");

/**
 * @swagger
 * tags:
 *   - name: SendMail
 *     description: Маршруты для отправки кода на email
 */

/**
 * @swagger
 * /api/sendmail:
 *   get:
 *     summary: Отправка кода на email
 *     description: Отправляет код на указанный email. Код и email жестко закодированы в этом маршруте.
  *     tags:
 *       - SendMail
 *     responses:
 *       200:
 *         description: Код успешно отправлен на email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *       500:
 *         description: Ошибка при отправке кода на email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Ошибка при отправке кода на email"
 *                 error:
 *                   type: string
 *                   example: "Описание ошибки"
 */

router.get("/", async (req, res) => {
  logger.info("Получен запрос на отправку кода на email");

  try {
    await sendCodeToMail("luxeivan@gmail.com", 5289);
    logger.info("Код успешно отправлен на email luxeivan@gmail.com");
    res.json({ status: "ok" });
  } catch (error) {
    logger.error(`Ошибка при отправке кода на email: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: "Ошибка при отправке кода на email",
      error: error.message,
    });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const sendCodeToMail = require("../services/sendCodeToMail");
// const logger = require("../logger");

// router.get("/", async (req, res) => {
//   logger.info("Получен запрос на отправку кода на email");

//   try {
//     await sendCodeToMail("luxeivan@gmail.com", 5289);
//     logger.info("Код успешно отправлен на email luxeivan@gmail.com");
//     res.json({ status: "ok" });
//   } catch (error) {
//     logger.error(`Ошибка при отправке кода на email: ${error.message}`);
//     res.status(500).json({
//       status: "error",
//       message: "Ошибка при отправке кода на email",
//       error: error.message,
//     });
//   }
// });

// module.exports = router;
