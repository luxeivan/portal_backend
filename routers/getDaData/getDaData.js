const axios = require("axios");
const express = require("express");
const { validationResult, query } = require("express-validator");
const getDaData = express.Router();

const DADATA_TOKEN = process.env.DADATA_TOKEN;
const DADATA_BASE_URL = "http://suggestions.dadata.ru/suggestions/api/4_1/rs";

// Функция для определения URL в зависимости от типа данных
const getDaDataUrl = (type) => {
  switch (type) {
    case "Фамилия":
    case "Имя":
    case "Отчество":
      return `${DADATA_BASE_URL}/suggest/fio`;
    case "ИНН":
      return `${DADATA_BASE_URL}/findById/party`;
    case "БИК":
      return `${DADATA_BASE_URL}/findById/bank`;
    case "country":
    case "region":
    case "area":
    case "city":
    case "settlement":
    case "street":
    case "fullAddress":
      return `${DADATA_BASE_URL}/suggest/address`;
    default:
      return null;
  }
};

// Функция для определения частей адреса и ФИО
const getBoundsAndParts = (type) => {
  switch (type) {
    case "Фамилия":
      return { parts: ["SURNAME"] };
    case "Имя":
      return { parts: ["NAME"] };
    case "Отчество":
      return { parts: ["PATRONYMIC"] };
    case "country":
      return {
        from: "country",
        to: "country",
        locations: [
          {
            country_iso_code: "*",
          },
        ],
      };
    case "region":
      return { from: "region", to: "region" };
    case "area":
      return { from: "area", to: "area" };
    case "city":
      return { from: "city", to: "city" };
    case "settlement":
      return { from: "settlement", to: "settlement" };
    case "street":
      return { from: "street", to: "street" };
    case "fullAddress":
      return [];
    default:
      return {};
  }
};

/**
 * @swagger
 * /api/getDaData:
 *   get:
 *     summary: Поиск в DaData (универсальный)
 *     tags: ["🌐 DaData"]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Фамилия, Имя, Отчество, ИНН, БИК, country, region, area, city, settlement, street, fullAddress]
 *       - in: query
 *         name: query
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: locations
 *         required: false
 *         schema: { type: string }
 *         description: JSON-строка массива `locations` (см. DaData API)
 *     responses:
 *       200:
 *         description: Результаты поиска
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *       400: { description: Пустой запрос или неподдерживаемый тип }
 *       500: { description: Ошибка запроса к DaData }
 */

getDaData.get(
  "/",
  query("type").notEmpty(),
  query("query").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ status: "error", message: "Пустое поле поиска или тип" });
    }
    // console.log(req.query);

    const {
      type,
      query: searchQuery,
      locations = [
        {
          country_iso_code: "*",
        },
      ],
    } = req.query;
    const url = getDaDataUrl(type);
    const { from, to, parts } = getBoundsAndParts(type);

    if (!url) {
      return res
        .status(400)
        .json({ status: "error", message: "Неподдерживаемый тип данных" });
    }

    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${DADATA_TOKEN}`,
      },
    };

    const body = {
      query: searchQuery,
      ...(parts && { parts }),
      ...(from &&
        to && {
          from_bound: { value: from },
          to_bound: { value: to },
        }),
      ...(locations && { locations }),
    };
    console.log(body);
    try {
      console.log(url, body, options);
      const result = await axios.post(url, body, options);

      res.json({ status: "ok", data: result.data.suggestions });
    } catch (error) {
      console.error("Ошибка запроса к DaData:", error);
      res
        .status(500)
        .json({ status: "error", message: "Ошибка запроса к DaData" });
    }
  }
);

module.exports = getDaData;
