const express = require("express");
const axios = require("axios");
const logger = require("../logger");
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
    const formattedQuestions = []
    formattedQuestions.push({
      IsFolder: true,
      Description: "",
      Ref_Key: "00000000-0000-0000-0000-000000000000",
      children: []
    })
    questionsArray.filter(item => item.IsFolder).forEach((item) => {
      formattedQuestions.push({
        IsFolder: true,
        Description: item.Description,
        Ref_Key: item.Ref_Key,
        children: []
      })
    }
    )
    questionsArray.filter(item => !item.IsFolder).forEach(item => {     
        formattedQuestions[formattedQuestions.findIndex(elem => elem.Ref_Key === item.Parent_Key)].children.push({
          question: item.question,
          answer: item.answer,
          IsFolder: item.IsFolder,
          Parent_Key: item.Parent_Key,
          Ref_Key: item.Ref_Key,
        })      
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
  }
});

module.exports = router;
