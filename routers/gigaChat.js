const express = require("express");
const { v4: uuidv4 } = require("uuid");
const os = require("os");
const sendMessageToGigachat = require("../services/gigaChat");
const logger = require("../logger");

const gigaChatRouter = express.Router();
const PORTAL_ENV =
  process.env.PORTAL_ENV ||
  process.env.BACK_ENV ||
  process.env.NODE_ENV ||
  "local";

const getIp = (req) => {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || null;
};

const buildCtx = (req, extra = {}) => ({
  env: PORTAL_ENV,
  requestId: extra.requestId || uuidv4(),
  ip: getIp(req),
  url: req.originalUrl,
  method: req.method,
  referer: req.get("referer") || null,
  userAgent: req.get("user-agent") || null,
  acceptLanguage: req.get("accept-language") || null,
  hostname: os.hostname(),
  extra,
});

const buildStack = (ctx, error) => {
  const ctxStr = `CTX=${JSON.stringify(ctx)}`;
  return error?.stack ? `${error.stack}\n---\n${ctxStr}` : ctxStr;
};

/**
 * @swagger
 * /api/gigachat:
 *   post:
 *     summary: Отправить сообщение в GigaChat
 *     tags: ["🌐 GigaChat"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, example: Привет, как дела? }
 *     responses:
 *       200: { description: Успешный ответ от GigaChat }
 *       500: { description: Ошибка взаимодействия с GigaChat }
 */
gigaChatRouter.post("/", async (req, res) => {
  const message = req.body?.message;
  const requestId = uuidv4();
  const ctx = buildCtx(req, { scope: "gigachat-service", requestId });

  logger.info("[GigaChat API] Входящее сообщение", {
    stack: buildStack({ ...ctx, msg_len: String(message || "").length }),
  });

  try {
    const answer = await sendMessageToGigachat(message);
    logger.info("[GigaChat API] Ответ модели сформирован", {
      stack: buildStack({ ...ctx, answer_len: (answer || "").length }),
    });
    res.json({ status: "ОК", answer });
  } catch (error) {
    logger.error("[GigaChat API] Ошибка обработки сообщения", {
      stack: buildStack(ctx, error),
    });
    res.json({ status: "error", error: error.message });
  }
});

module.exports = gigaChatRouter;
