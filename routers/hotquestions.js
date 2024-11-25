const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const SERVER_1C = process.env.SERVER_1C;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;

const headers = {
  Authorization: server1c_auth,
};

//Роутер на получение вопросов/ответов
router.get("/", async (req, res) => {
  try {
    //Запрашиваем инфу
    // const hotQuestions = await axios.get(
    //   `${SERVER_1C}/Catalog_quickAnswers/?$format=json`,
    //   { headers }
    // );

    //$filter=DeletionMark%20eq%20false фильтр говорит серверу вернуть только те записи, у которых поле DeletionMark равно false, то есть объекты, не помеченные на удаление.

    const hotQuestions = await axios.get(
      `${SERVER_1C}/Catalog_quickAnswers/?$format=json&$filter=DeletionMark%20eq%20false`,
      { headers }
    );

    // console.log("Проверяем что тут приходит", hotQuestions);

    const questionsArray = hotQuestions.data.value;

    // console.log("Проверяем что тут приходит", questionsArray);

    const formattedQuestions = questionsArray.map((item) => ({
      question: item.question,
      answer: item.answer,
    }));

    console.log("Проверяем что тут приходит", formattedQuestions);

    res.status(200).json(formattedQuestions);
  } catch (error) {
    console.log(
      "Ошибка при получении данных о 'Горячих ответах' из 1С:",
      error
    );
    res.status(500).json({
      message: "Ошибка при получении данных о 'Горячих ответах' из 1С",
    });
  }
});

module.exports = router;
