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
    case "Адрес":
      return `${DADATA_BASE_URL}/suggest/address`;
    default:
      return null;
  }
};

const getParts = (type) => {
  switch (type) {
    case "Фамилия":
      return ["SURNAME"];
    case "Имя":
      return ["NAME"];
    case "Отчество":
      return ["PATRONYMIC"];
    default:
      return [];
  }
};

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
    const parts = getParts(type);

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

    try {
      const result = await axios.post(
        url,
        { query: searchQuery, parts },
        options
      );
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
//       return `${DADATA_BASE_URL}/suggest/fio`;
//     case "Имя":
//     case "Отчество":
//       return `${DADATA_BASE_URL}/suggest/fio`;
//     case "ИНН":
//       return `${DADATA_BASE_URL}/findById/party`;
//     case "Адрес":
//       return `${DADATA_BASE_URL}/suggest/address`;
//     // другие случаи по мере необходимости
//     default:
//       return null;
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

//     try {
//       const result = await axios.post(url, { query: searchQuery }, options);
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
