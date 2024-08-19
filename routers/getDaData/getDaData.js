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
    case "Страна":
    case "Регион":
    case "Город":
    case "Район":
    case "Улица":
    case "АдресПолный":
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
    case "Страна":
      return {
        from: "country",
        to: "country",
        locations: [{ country_iso_code: "*" }],
      };
    case "Регион":
      return { from: "region", to: "region" };
    case "Город":
      return { from: "city", to: "city" };
    case "Район":
      return { from: "area", to: "area" };
    case "Улица":
      return { from: "street", to: "street" };
    case "АдресПолный":
      return [];
    default:
      return {};
  }
};

/**
 * @swagger
 * tags:
 *   - name: DaData
 *     description: Маршруты для взаимодействия с API DaData для подсказок по ФИО, ИНН, адресам и т.д.
 */

/**
 * @swagger
 * /api/getDaData:
 *   get:
 *     summary: Получить данные из DaData по типу и запросу
 *     description: Получает данные из DaData в зависимости от типа данных (ФИО, ИНН, адрес и т.д.).
 *     tags:
 *       - DaData
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Тип данных (Фамилия, Имя, Отчество, ИНН, Страна, Регион, Город, Район, Улица, АдресПолный)
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Запрос для поиска данных
 *     responses:
 *       200:
 *         description: Успешный ответ с данными из DaData
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 data:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/ПодсказкаФИО'
 *                       - $ref: '#/components/schemas/ПоискИНН'
 *                       - $ref: '#/components/schemas/ПодсказкаАдрес'
 *       400:
 *         description: Пустое поле поиска или тип
 *       500:
 *         description: Ошибка запроса к DaData
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ПодсказкаФИО:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           example: Иванов Иван Иванович
 *         data:
 *           type: object
 *           properties:
 *             surname:
 *               type: string
 *               example: Иванов
 *             name:
 *               type: string
 *               example: Иван
 *             patronymic:
 *               type: string
 *               example: Иванович
 *     ПоискИНН:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           example: ООО "Ромашка"
 *         data:
 *           type: object
 *           properties:
 *             inn:
 *               type: string
 *               example: 1234567890
 *             kpp:
 *               type: string
 *               example: 123456789
 *             ogrn:
 *               type: string
 *               example: 1234567890123
 *     ПодсказкаАдрес:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           example: Россия, г Москва, ул Тверская, д 1
 *         data:
 *           type: object
 *           properties:
 *             country:
 *               type: string
 *               example: Россия
 *             region:
 *               type: string
 *               example: Москва
 *             city:
 *               type: string
 *               example: Москва
 *             street:
 *               type: string
 *               example: Тверская
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

    const { type, query: searchQuery } = req.query;
    const url = getDaDataUrl(type);
    const { from, to, parts, locations } = getBoundsAndParts(type);

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

    try {
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

// const axios = require("axios");
// const express = require("express");
// const { validationResult, query } = require("express-validator");
// const getDaData = express.Router();

// const DADATA_TOKEN = process.env.DADATA_TOKEN;
// const DADATA_BASE_URL = "http://suggestions.dadata.ru/suggestions/api/4_1/rs";

// // Функция для определения URL в зависимости от типа данных
// const getDaDataUrl = (type) => {
//   switch (type) {
//     case "Фамилия":
//     case "Имя":
//     case "Отчество":
//       return `${DADATA_BASE_URL}/suggest/fio`;
//     case "ИНН":
//       return `${DADATA_BASE_URL}/findById/party`;
//     case "Страна":
//     case "Регион":
//     case "Город":
//     case "Район":
//     case "Улица":
//     case "АдресПолный":
//       return `${DADATA_BASE_URL}/suggest/address`;
//     default:
//       return null;
//   }
// };

// // Функция для определения частей адреса и ФИО
// const getBoundsAndParts = (type) => {
//   switch (type) {
//     case "Фамилия":
//       return { parts: ["SURNAME"] };
//     case "Имя":
//       return { parts: ["NAME"] };
//     case "Отчество":
//       return { parts: ["PATRONYMIC"] };
//     case "Страна":
//       return {
//         from: "country",
//         to: "country",
//         locations: [{ country_iso_code: "*" }],
//       };
//     case "Регион":
//       return { from: "region", to: "region" };
//     case "Город":
//       return { from: "city", to: "city" };
//     case "Район":
//       return { from: "area", to: "area" };
//     case "Улица":
//       return { from: "street", to: "street" };
//     case "АдресПолный":
//       return [];
//     default:
//       return {};
//   }
// };

// getDaData.get(
//   "/",
//   query("type").notEmpty(),
//   query("query").notEmpty(),
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "Пустое поле поиска или тип" });
//     }

//     const { type, query: searchQuery } = req.query;
//     const url = getDaDataUrl(type);
//     const { from, to, parts, locations } = getBoundsAndParts(type);

//     if (!url) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "Неподдерживаемый тип данных" });
//     }

//     const options = {
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         Authorization: `Token ${DADATA_TOKEN}`,
//       },
//     };

//     const body = {
//       query: searchQuery,
//       ...(parts && { parts }),
//       ...(from &&
//         to && {
//           from_bound: { value: from },
//           to_bound: { value: to },
//         }),
//       ...(locations && { locations }),
//     };

//     try {
//       const result = await axios.post(url, body, options);
//       res.json({ status: "ok", data: result.data.suggestions });
//     } catch (error) {
//       console.error("Ошибка запроса к DaData:", error);
//       res
//         .status(500)
//         .json({ status: "error", message: "Ошибка запроса к DaData" });
//     }
//   }
// );

// module.exports = getDaData;
