const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const https = require("https");
require("dotenv").config();
const logger = require("../logger");

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

// Вспомогательные утилиты для логирования и маскирования секретов
const redact = (s, visible = 4) => {
  if (!s) return "";
  const v = String(s);
  return v.length <= visible ? "*".repeat(v.length) : v.slice(0, visible) + "…";
};
const preview = (s, len = 300) => {
  if (s == null) return "";
  const str = String(s);
  return str.length > len ? str.slice(0, len) + "…" : str;
};
const elapsedMs = (start) => Number(process.hrtime.bigint() - start) / 1e6;

// Функция для получения токена доступа
const getAccessToken = async (reqId) => {
  if (accessTokenCache && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    logger.info("[GigaChat] [%s] Использую кэшированный токен, осталось ~%s сек.", reqId, Math.round((tokenExpiresAt - Date.now()) / 1000));
    return accessTokenCache;
  }

  logger.info("[GigaChat] [%s] Запрашиваю новый токен. Клиент: %s", reqId, redact(clientId));
  const authData = `${clientId}:${clientSecret}`;
  const encodedAuthData = Buffer.from(authData).toString("base64");
  const rqUid = uuidv4();

  try {
    const response = await axios.post(
      "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
      "scope=GIGACHAT_API_PERS", // или другой scope в зависимости от вашего типа доступа
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          RqUID: rqUid, // уникальный идентификатор запроса
          Authorization: `Basic ${encodedAuthData}`,
        },
        httpsAgent: httpsAgent, // Используем агент HTTPS
      }
    );

    logger.info("[GigaChat] [%s] Токен получен (status %s). Кэшируем на 29 минут.", reqId, response.status);

    const { access_token } = response.data;

    // Обновляем кэш токена и время истечения
    accessTokenCache = access_token;
    tokenExpiresAt = Date.now() + 29 * 60 * 1000; // Токен действителен 29 минут

    return access_token;
  } catch (error) {
    logger.error("[GigaChat] [%s] Ошибка при получении токена: status=%s, code=%s, details=%s", reqId, error?.response?.status || "нет", error?.code || "нет", JSON.stringify(error?.response?.data || error.message));
    throw error;
  }
};

// Функция для отправки сообщения и получения ответа от GigaChat
const sendMessageToGigachat = async (message, reqId) => {
  const t0 = process.hrtime.bigint();
  logger.info("[GigaChat] [%s] Отправка сообщения в GigaChat. Длина сообщения=%s. Превью: %s", reqId, String(message||"").length, preview(message));
  const accessToken = await getAccessToken(reqId);

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
    logger.info("[GigaChat] [%s] Ответ получен (status %s, %s мс). Длина ответа=%s. Превью: %s", reqId, response.status, elapsedMs(t0).toFixed(1), String(botResponse||"").length, preview(botResponse));
    return botResponse;
  } catch (error) {
    logger.error("[GigaChat] [%s] Ошибка при отправке сообщения: status=%s, code=%s, details=%s", reqId, error?.response?.status || "нет", error?.code || "нет", JSON.stringify(error?.response?.data || error.message));
    throw error;
  }
};

// Эндпоинт для обработки чата
router.post("/", async (req, res) => {
  const reqId = uuidv4();
  logger.info("[GigaChat] [%s] Принят запрос от клиента. IP=%s, UA=%s, тело=%s", reqId, req.ip, req.get("user-agent"), JSON.stringify(req.body));
  const userMessage = req.body.message;

  if (!userMessage) {
    logger.warn("[GigaChat] [%s] Сообщение пустое — возвращаю 400.", reqId);
    return res.status(400).json({ error: "Сообщение не должно быть пустым" });
  }

  try {
    const botResponse = await sendMessageToGigachat(userMessage, reqId);
    res.json({ response: botResponse });
    logger.info("[GigaChat] [%s] Ответ отправлен клиенту.", reqId);
  } catch (error) {
    logger.error("[GigaChat] [%s] Ошибка при обращении к GigaChat API: %s", reqId, error?.message);
    res.status(500).json({ error: "Ошибка при обращении к GigaChat API" });
  }
});

module.exports = router;
