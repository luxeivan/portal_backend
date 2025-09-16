const express = require("express");
const { v4: uuidv4 } = require("uuid");
const logger = require("../logger");
const sendMessageToGigachat = require("../services/gigaChat");
const gigaChatRouter = express.Router();


/**
 * @swagger
 * /api/gigachat:
 *   post:
 *     summary: Отправить сообщение в GigaChat
 *     description: |
 *       Делегирует запрос внутреннему сервису `sendMessageToGigachat`
 *       и возвращает ответ модели.
 *     tags: ["🌐 GigaChat"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 example: Привет, как дела?
 *     responses:
 *       200:
 *         description: Успешный ответ от GigaChat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ОК }
 *                 answer: { type: string, example: Всё отлично, спасибо! }
 *       500:
 *         description: Ошибка взаимодействия с GigaChat
 */

gigaChatRouter.post("/", async (req, res) => {
  const reqId = uuidv4();
  const message = req.body.message;
  logger.info("[GigaChat API] [%s] Принято сообщение пользователя. Превью: %s", reqId, (req.body?.message ?? "").toString().slice(0, 300) + ((req.body?.message || "").toString().length > 300 ? "…" : ""));
  try {
    const answer = await sendMessageToGigachat(message, reqId);
    logger.info("[GigaChat API] [%s] Ответ модели сформирован. Длина=%s.", reqId, String(answer||"").length);
    res.json({ status: "ОК", answer });
  } catch (error) {
    logger.error("[GigaChat API] [%s] Ошибка обработки запроса: %s", reqId, error?.message);
    res.json({ status: "error", error: error.message });
  }
});

module.exports = gigaChatRouter;
