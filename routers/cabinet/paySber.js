const express = require("express");
const paySber = express.Router();
const { registerOrderSber } = require("../../services/servicesPaySber");

/**
 * @swagger
 * /api/cabinet/paySber:
 *   post:
 *     summary: Инициация оплаты через Сбербанк
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               zakaz:
 *                 type: string
 *                 example: "123456789"
 *               amount:
 *                 type: number
 *                 example: 2500.00
 *     responses:
 *       200:
 *         description: Успешное создание платежа
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 formUrl:
 *                   type: string
 *                   example: "https://securepayments.sberbank.ru/paymentform?orderId=xyz789"
 *       400:
 *         description: Неверные параметры запроса
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *       500:
 *         description: Ошибка при создании платежа
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Ошибка соединения с Сбербанк API"
 */

paySber.post("/", async (req, res) => {
  const { zakaz, amount } = req.body;
  if (!zakaz || !amount) return res.status(400).json({ status: "error" });

  try {
    const formUrl = await registerOrderSber(zakaz, amount);
    return res.json({ status: "ok", formUrl });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message });
  }
});

module.exports = paySber;
