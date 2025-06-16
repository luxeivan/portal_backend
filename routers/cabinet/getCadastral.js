const { default: axios } = require("axios");
const express = require("express");
const { validationResult, query } = require("express-validator");
const getCadastral = express.Router();
const url = "https://cleaner.dadata.ru/api/v1/clean/address";

const token = process.env.DADATA_TOKEN;

/**
 * @swagger
 * /api/cabinet/get-cadastral:
 *   get:
 *     summary: Очистка адреса + кадастровые данные
 *     tags: ["🌐 DaData"]
 *     parameters:
 *       - in: query
 *         name: addressObject
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Данные получены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 data:   { type: array,  items: { type: object } }
 *       400: { description: Пустое поле поиска }
 *       500: { description: Ошибка обращения к DaData }
 */

getCadastral.get("/", query("addressObject").notEmpty(), async (req, res) => {
  // Проверка-------------------------
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.json({ status: "error", message: "Пустое поле поиска" });
  }
  // -------------------------
  const { addressObject } = req.query;
  const options = {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Token " + token,
    },
  };
  axios
    .post(url, { query: addressObject }, options)
    .then((result) => {
      //console.log(result.data)
      res.json({ status: "ok", data: result.data });
    })
    .catch((error) => {
      console.log("error", error);
      res.json({ status: "error", message: "ошибка получения организации" });
    });
});

module.exports = getCadastral;
