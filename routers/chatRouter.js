const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const https = require("https");
const os = require("os");
const logger = require("../logger");
require("dotenv").config();

const router = express.Router();

const clientId = process.env.GIGACHAT_CLIENT_ID;
const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;
const PORTAL_ENV =
  process.env.PORTAL_ENV ||
  process.env.BACK_ENV ||
  process.env.NODE_ENV ||
  "local";

// Кэш токена
let accessTokenCache = null;
let tokenExpiresAt = null;

// Агент HTTPS без проверки сертификата (как у тебя было)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// ---------- УТИЛИТЫ ДЛЯ ЛОГИРОВАНИЯ ----------

const getIp = (req) => {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || null;
};

const buildContext = (req, extra = {}) => ({
  env: PORTAL_ENV,
  requestId: extra.requestId || uuidv4(),
  ip: req ? getIp(req) : null,
  url: req?.originalUrl || null,
  method: req?.method || null,
  referer: req?.get?.("referer") || null,
  userAgent: req?.get?.("user-agent") || null,
  acceptLanguage: req?.get?.("accept-language") || null,
  hostname: os.hostname(),
  extra,
});

const buildStack = (ctx, error) => {
  const ctxStr = `CTX=${JSON.stringify(ctx)}`;
  return error?.stack ? `${error.stack}\n---\n${ctxStr}` : ctxStr;
};

// ---------- GigaChat OAuth ----------

const getAccessToken = async (logCtxBase = {}) => {
  const now = Date.now();
  if (accessTokenCache && tokenExpiresAt && now < tokenExpiresAt) {
    logger.info("[GigaChat OAuth] Используем кэшированный токен", {
      stack: buildStack({ ...logCtxBase, cacheHit: true }),
    });
    return accessTokenCache;
  }

  const authData = `${clientId}:${clientSecret}`;
  const encodedAuthData = Buffer.from(authData).toString("base64");

  logger.info("[GigaChat OAuth] Запрашиваем новый токен", {
    stack: buildStack({
      ...logCtxBase,
      clientId,
      basicAuthLen: encodedAuthData.length,
    }),
  });

  try {
    const started = Date.now();
    const response = await axios.post(
      "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
      "scope=GIGACHAT_API_PERS",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          RqUID: uuidv4(),
          Authorization: `Basic ${encodedAuthData}`,
        },
        httpsAgent,
      }
    );

    const took = Date.now() - started;
    const { access_token } = response.data || {};

    accessTokenCache = access_token;
    tokenExpiresAt = now + 29 * 60 * 1000;

    logger.info("[GigaChat OAuth] Токен получен", {
      stack: buildStack({
        ...logCtxBase,
        took_ms: took,
        tokenPresent: !!access_token,
      }),
    });

    return access_token;
  } catch (error) {
    logger.error("[GigaChat OAuth] Ошибка при получении токена", {
      stack: buildStack(
        {
          ...logCtxBase,
          status: error?.response?.status,
          data: error?.response?.data,
        },
        error
      ),
    });
    throw error;
  }
};

// ---------- GigaChat Chat Completions ----------

const sendMessageToGigachat = async (message, logCtxBase = {}) => {
  const accessToken = await getAccessToken(logCtxBase);

  try {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    };

    const started = Date.now();
    logger.info("[GigaChat API] Отправляем запрос completions", {
      stack: buildStack({
        ...logCtxBase,
        msg_len: String(message || "").length,
      }),
    });

    const response = await axios.post(
      "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        httpsAgent,
      }
    );

    const took = Date.now() - started;
    const botResponse = response.data?.choices?.[0]?.message?.content || "";

    logger.info("[GigaChat API] Ответ получен", {
      stack: buildStack({
        ...logCtxBase,
        took_ms: took,
        answer_len: botResponse.length,
      }),
    });

    return botResponse;
  } catch (error) {
    logger.error("[GigaChat API] Ошибка при отправке сообщения", {
      stack: buildStack(
        {
          ...logCtxBase,
          status: error?.response?.status,
          data: error?.response?.data,
        },
        error
      ),
    });
    throw error;
  }
};

// ---------- Эндпоинт ----------

router.post("/", async (req, res) => {
  const requestId = uuidv4();
  const ctx = buildContext(req, {
    scope: "gigachat",
    step: "incoming",
    requestId,
  });

  logger.info("[GigaChat API] Получен запрос от клиента", {
    stack: buildStack(ctx),
  });

  const userMessage = req.body?.message;
  if (!userMessage) {
    logger.warn("[GigaChat API] Пустое сообщение от клиента", {
      stack: buildStack(ctx),
    });
    return res.status(400).json({ error: "Сообщение не должно быть пустым" });
  }

  try {
    const answer = await sendMessageToGigachat(userMessage, ctx);
    logger.info("[GigaChat API] Успешный ответ отправлен клиенту", {
      stack: buildStack({ ...ctx, answer_len: (answer || "").length }),
    });
    res.json({ response: answer });
  } catch (error) {
    logger.error("[GigaChat API] Сбой при обработке запроса клиента", {
      stack: buildStack(ctx, error),
    });
    res.status(500).json({ error: "Ошибка при обращении к GigaChat API" });
  }
});

module.exports = router;

// const express = require("express");
// const axios = require("axios");
// const { v4: uuidv4 } = require("uuid");
// const https = require("https");
// require("dotenv").config();
// const logger = require("../logger");

// const router = express.Router();

// const clientId = process.env.GIGACHAT_CLIENT_ID;
// const clientSecret = process.env.GIGACHAT_CLIENT_SECRET;

// // Кэширование токена доступа
// let accessTokenCache = null;
// let tokenExpiresAt = null;

// // Настраиваем агент HTTPS, игнорирующий ошибки проверки сертификата
// const httpsAgent = new https.Agent({
//   rejectUnauthorized: false, // Отключаем проверку сертификата
// });

// // Вспомогательные утилиты для логирования и маскирования секретов
// const redact = (s, visible = 4) => {
//   if (!s) return "";
//   const v = String(s);
//   return v.length <= visible ? "*".repeat(v.length) : v.slice(0, visible) + "…";
// };
// const preview = (s, len = 300) => {
//   if (s == null) return "";
//   const str = String(s);
//   return str.length > len ? str.slice(0, len) + "…" : str;
// };
// const elapsedMs = (start) => Number(process.hrtime.bigint() - start) / 1e6;

// // Функция для получения токена доступа
// const getAccessToken = async (reqId) => {
//   if (accessTokenCache && tokenExpiresAt && Date.now() < tokenExpiresAt) {
//     logger.info("[GigaChat] [%s] Использую кэшированный токен, осталось ~%s сек.", reqId, Math.round((tokenExpiresAt - Date.now()) / 1000));
//     return accessTokenCache;
//   }

//   logger.info("[GigaChat] [%s] Запрашиваю новый токен. Клиент: %s", reqId, redact(clientId));
//   const authData = `${clientId}:${clientSecret}`;
//   const encodedAuthData = Buffer.from(authData).toString("base64");
//   const rqUid = uuidv4();

//   try {
//     const response = await axios.post(
//       "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
//       "scope=GIGACHAT_API_PERS", // или другой scope в зависимости от вашего типа доступа
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//           Accept: "application/json",
//           RqUID: rqUid, // уникальный идентификатор запроса
//           Authorization: `Basic ${encodedAuthData}`,
//         },
//         httpsAgent: httpsAgent, // Используем агент HTTPS
//       }
//     );

//     logger.info("[GigaChat] [%s] Токен получен (status %s). Кэшируем на 29 минут.", reqId, response.status);

//     const { access_token } = response.data;

//     // Обновляем кэш токена и время истечения
//     accessTokenCache = access_token;
//     tokenExpiresAt = Date.now() + 29 * 60 * 1000; // Токен действителен 29 минут

//     return access_token;
//   } catch (error) {
//     logger.error("[GigaChat] [%s] Ошибка при получении токена: status=%s, code=%s, details=%s", reqId, error?.response?.status || "нет", error?.code || "нет", JSON.stringify(error?.response?.data || error.message));
//     throw error;
//   }
// };

// // Функция для отправки сообщения и получения ответа от GigaChat
// const sendMessageToGigachat = async (message, reqId) => {
//   const t0 = process.hrtime.bigint();
//   logger.info("[GigaChat] [%s] Отправка сообщения в GigaChat. Длина сообщения=%s. Превью: %s", reqId, String(message||"").length, preview(message));
//   const accessToken = await getAccessToken(reqId);

//   try {
//     const response = await axios.post(
//       "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
//       {
//         model: "gpt-3.5-turbo", // Укажите нужную модель
//         messages: [{ role: "user", content: message }],
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           Authorization: `Bearer ${accessToken}`,
//         },
//         httpsAgent: httpsAgent, // Используем агент HTTPS
//       }
//     );

//     const botResponse = response.data.choices[0].message.content;
//     logger.info("[GigaChat] [%s] Ответ получен (status %s, %s мс). Длина ответа=%s. Превью: %s", reqId, response.status, elapsedMs(t0).toFixed(1), String(botResponse||"").length, preview(botResponse));
//     return botResponse;
//   } catch (error) {
//     logger.error("[GigaChat] [%s] Ошибка при отправке сообщения: status=%s, code=%s, details=%s", reqId, error?.response?.status || "нет", error?.code || "нет", JSON.stringify(error?.response?.data || error.message));
//     throw error;
//   }
// };

// // Эндпоинт для обработки чата
// router.post("/", async (req, res) => {
//   const reqId = uuidv4();
//   logger.info("[GigaChat] [%s] Принят запрос от клиента. IP=%s, UA=%s, тело=%s", reqId, req.ip, req.get("user-agent"), JSON.stringify(req.body));
//   const userMessage = req.body.message;

//   if (!userMessage) {
//     logger.warn("[GigaChat] [%s] Сообщение пустое — возвращаю 400.", reqId);
//     return res.status(400).json({ error: "Сообщение не должно быть пустым" });
//   }

//   try {
//     const botResponse = await sendMessageToGigachat(userMessage, reqId);
//     res.json({ response: botResponse });
//     logger.info("[GigaChat] [%s] Ответ отправлен клиенту.", reqId);
//   } catch (error) {
//     logger.error("[GigaChat] [%s] Ошибка при обращении к GigaChat API: %s", reqId, error?.message);
//     res.status(500).json({ error: "Ошибка при обращении к GigaChat API" });
//   }
// });

// module.exports = router;
