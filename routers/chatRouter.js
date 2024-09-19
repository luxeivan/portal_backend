const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const https = require("https");
require("dotenv").config();

const router = express.Router();

const clientId = process.env.GIGACHAT_CLIENT_ID;
const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;

// Кэширование токена доступа
let accessTokenCache = null;
let tokenExpiresAt = null;

// Настраиваем агент HTTPS, игнорирующий ошибки проверки сертификата
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Отключаем проверку сертификата
});

// Функция для получения токена доступа
const getAccessToken = async () => {
  if (accessTokenCache && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return accessTokenCache;
  }

  const authData = `${clientId}:${clientSecret}`;
  const encodedAuthData = Buffer.from(authData).toString("base64");

  console.log(`Client ID: ${clientId}`);
  console.log(`Client Secret: ${clientSecret}`);

  console.log("Requesting new token with:", authData, encodedAuthData);

  try {
    const response = await axios.post(
      "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
      "scope=GIGACHAT_API_PERS", // или другой scope в зависимости от вашего типа доступа
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          RqUID: uuidv4(), // уникальный идентификатор запроса
          Authorization: `Basic ${encodedAuthData}`,
        },
        httpsAgent: httpsAgent, // Используем агент HTTPS
      }
    );

    console.log("Token response:", response.data);

    const { access_token, expires_at } = response.data;

    // Обновляем кэш токена и время истечения
    accessTokenCache = access_token;
    tokenExpiresAt = Date.now() + 29 * 60 * 1000; // Токен действителен 29 минут

    return access_token;
  } catch (error) {
    console.error(
      "Ошибка при получении токена доступа:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Функция для отправки сообщения и получения ответа от GigaChat
const sendMessageToGigachat = async (message) => {
  const accessToken = await getAccessToken();

  try {
    const response = await axios.post(
      "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
      {
        model: "gpt-3.5-turbo", // Укажите нужную модель
        messages: [{ role: "user", content: message }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        httpsAgent: httpsAgent, // Используем агент HTTPS
      }
    );

    const botResponse = response.data.choices[0].message.content;
    return botResponse;
  } catch (error) {
    console.error(
      "Ошибка при отправке сообщения в GigaChat:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

// Эндпоинт для обработки чата
router.post("/", async (req, res) => {
  console.log("Получено тело запроса:", req.body);
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Сообщение не должно быть пустым" });
  }

  try {
    const botResponse = await sendMessageToGigachat(userMessage);
    res.json({ response: botResponse });
  } catch (error) {
    console.error("Ошибка при обращении к GigaChat API:", error);
    res.status(500).json({ error: "Ошибка при обращении к GigaChat API" });
  }
});

module.exports = router;
