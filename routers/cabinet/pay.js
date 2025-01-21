const express = require("express");
const jwt = require("jsonwebtoken");
const pay = express.Router();

const logger = require("../../logger");
const { requestPay } = require("../../services/servicesPay");


/**
 * @swagger
 * /api/cabinet/pay:
 *   post:
 *     summary: Оплата
 *     description: Оплата
 *     tags:
 *       - Оплата
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Идентификатор объекта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Оплата успешна
 *       400:
 *         description: Неверный запрос
 *       500:
 *         description: Внутренняя ошибка сервера
 */
pay.post("/", async (req, res) => {
    const zakaz = req.body.zakaz
    const amount = req.body.amount
    if (zakaz && amount) {
        const formUrl = await requestPay(zakaz, amount)
        if (formUrl) {
            res.json({ status: "ok", formUrl: formUrl })
        } else {
            res.status(500).json({ status: "error" })
        }
    } else {
        res.status(400).json({ status: "error" })
    }
});

module.exports = pay;
