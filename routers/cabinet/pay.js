const express = require("express");
const jwt = require("jsonwebtoken");
const pay = express.Router();

const logger = require("../../logger");
const { requestPay } = require("../../services/servicesPay");

/**
 * @swagger
 * /api/cabinet/pay:
 *   post:
 *     summary: Инициация оплаты через ВТБ
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
 *                 example: "123456789"
 *               amount:
 *                 type: number
 *                 example: 1500.00
 *     responses:
 *       200:
 *         description: Ссылка на платёжную форму ВТБ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:  { type: string, example: ok }
 *                 formUrl: { type: string, example: "https://3dsec.example.com/payform?orderId=abc123" }
 *       400:
 *         description: zakaz или amount не переданы
 *       500:
 *         description: Ошибка внутри сервиса VTB
 */

pay.post("/", async (req, res) => {
  const zakaz = req.body.zakaz;
  const amount = req.body.amount;
  if (zakaz && amount) {
    const formUrl = await requestPay(zakaz, amount);
    if (formUrl) {
      res.json({ status: "ok", formUrl: formUrl });
    } else {
      res.status(500).json({ status: "error" });
    }
  } else {
    res.status(400).json({ status: "error" });
  }
});

module.exports = pay;
