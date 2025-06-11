const { default: axios } = require("axios");
const express = require("express");
const {
  check,
  validationResult,
  checkSchema,
  body,
  param,
  query,
} = require("express-validator");
const getFias = express.Router();
const url =
  "http://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";

const token = process.env.DADATA_TOKEN;

/**
 * @swagger
 * /api/cabinet/get-fias:
 *   get:
 *     summary: Поиск адреса (ФИАС)
 *     tags: ["🌐 DaData"]
 *     parameters:
 *       - in: query
 *         name: searchString
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Подсказки адресов
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

getFias.get(
  "/",
  query("searchString").notEmpty(),

  async (req, res) => {
    // Проверка-------------------------
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.json({ status: "error", message: "Пустое поле поиска" });
    }
    // -------------------------
    const { searchString } = req.query;
    const options = {
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token " + token,
      },
    };
    axios
      .post(url, { query: searchString }, options)
      .then((result) => {
        //console.log(result.data)
        res.json({ status: "ok", data: result.data.suggestions });
      })
      .catch((error) => {
        console.log("error", error);
        res.json({ status: "error", message: "ошибка получения ФИАС" });
      });
  }
);

module.exports = getFias;
