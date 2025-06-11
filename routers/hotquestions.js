const express = require("express");
const axios = require("axios");
const logger = require("../logger");
require("dotenv").config();

const router = express.Router();

const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;

// Адрес, по которому будем оповещать бота
// (если бот и бэкенд на одном сервере, указывайте http://127.0.0.1:3001/notifyError)
const botNotifyUrl =
  process.env.BOT_NOTIFY_URL || "http://127.0.0.1:3001/notifyError";

const headers = {
  Authorization: server1c_auth,
};


/**
 * @swagger
 * /api/hotQuestions:
 *   get:
 *     summary: Получить «горячие» вопросы и ответы
 *     description: |
 *       Читает каталог *Catalog_quickAnswers* в 1С и
 *       формирует вложенную структуру (папки / дочерние элементы).
 *     tags: ["🌐 HotQuestions"]
 *     responses:
 *       200:
 *         description: Список вопросов/ответов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   IsFolder:  { type: boolean }
 *                   Description: { type: string }
 *                   Ref_Key: { type: string }
 *                   children:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         question: { type: string }
 *                         answer:   { type: string }
 *       500:
 *         description: Ошибка при запросе к 1С
 */


router.get("/", async (req, res) => {
  try {
    //Запрашиваем инфу
    const hotQuestions = await axios.get(
      `${SERVER_1C}/Catalog_quickAnswers/?$format=json&$filter=DeletionMark%20eq%20false`,
      { headers }
    );

    // console.log("Проверяем что тут приходит", hotQuestions);

    const questionsArray = hotQuestions.data.value;

    // console.log("Проверяем что тут приходит", questionsArray);

    const formattedQuestions1 = questionsArray.map((item) => ({
      question: item.question,
      answer: item.answer,
      IsFolder: item.IsFolder,
      Parent_Key: item.Parent_Key,
      Ref_Key: item.Ref_Key,
    }));
    const formattedQuestions = [];
    formattedQuestions.push({
      IsFolder: true,
      Description: "",
      Ref_Key: "00000000-0000-0000-0000-000000000000",
      children: [],
    });
    questionsArray
      .filter((item) => item.IsFolder)
      .forEach((item) => {
        formattedQuestions.push({
          IsFolder: true,
          Description: item.Description,
          Ref_Key: item.Ref_Key,
          children: [],
        });
      });
    questionsArray
      .filter((item) => !item.IsFolder)
      .forEach((item) => {
        formattedQuestions[
          formattedQuestions.findIndex(
            (elem) => elem.Ref_Key === item.Parent_Key
          )
        ].children.push({
          question: item.question,
          answer: item.answer,
          IsFolder: item.IsFolder,
          Parent_Key: item.Parent_Key,
          Ref_Key: item.Ref_Key,
        });
      });
    // console.log("Проверяем что тут приходит", formattedQuestions);

    res.status(200).json(formattedQuestions);
  } catch (error) {
    console.log(
      "Ошибка при получении данных о 'Горячих ответах' из 1С:",
      error
    );
    res.status(500).json({
      message: "Ошибка при получении данных о 'Горячих ответах' из 1С",
    });

    // Если настроен адрес бота, пытаемся его оповестить
    if (botNotifyUrl) {
      try {
        const errorDetails = {
          message: `Ошибка при получении данных из 1C: ${error.message}`,
          error: {
            config: {
              url: error?.config?.url,
              method: error?.config?.method,
            },
            response: {
              status: error?.response?.status,
              statusText: error?.response?.statusText,
              data: error?.response?.data,
            },
            code: error?.code,
            message: error?.message || error?.response?.data?.message,
          },
        };
        await axios.post(botNotifyUrl, errorDetails);
      } catch (notifyErr) {
        console.error("Не смогли оповестить бота:", notifyErr);
      }
    }
  }
});

module.exports = router;
