const express = require("express");
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
  const message = req.body.message;
  try {
    const answer = await sendMessageToGigachat(message);
    res.json({ status: "ОК", answer });
  } catch (error) {
    res.json({ status: "error", error: error.message });
  }
});

module.exports = gigaChatRouter;
