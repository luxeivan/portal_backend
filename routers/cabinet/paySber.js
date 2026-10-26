const express = require("express");
const paySber = express.Router();
const { registerOrderSber } = require("../../services/servicesPaySber");

/**
 * @swagger
 * /api/cabinet/paySber:
 *   post:
 *     summary: Инициация оплаты через Сбербанк
 *     tags: ["🔒 Payments"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [zakaz, amount]
 *             properties:
 *               zakaz:
 *                 type: string
 *                 example: "987654321"
 *               amount:
 *                 type: number
 *                 example: 2500.00
 *     responses:
 *       200:
 *         description: Ссылка на платёжную форму Сбербанка
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:  { type: string, example: ok }
 *                 formUrl: { type: string, example: "https://securepayments.sberbank.ru/paymentform?orderId=xyz789" }
 *       400:
 *         description: zakaz или amount не переданы
 *       500:
 *         description: Ошибка внутри сервиса Сбербанка
 */

paySber.post("/", async (req, res) => {
  const { zakaz, amount } = req.body;
  if (!zakaz || !amount) return res.status(400).json({ status: "error" });

  try {
    const formUrl = await registerOrderSber(zakaz, amount);
    return res.json({ status: "ok", formUrl });
  } catch (e) {
    console.error("paySber:", e?.message || "unknown");
    return res.status(500).json({
      status: "error",
      message: "Ошибка при инициализации оплаты",
    });
  }
});

module.exports = paySber;
