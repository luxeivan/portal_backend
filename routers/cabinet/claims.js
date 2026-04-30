const express = require("express");
const router = express.Router();
const {
  createClaim,
  createNewClaim,
  getClaims,
  getClaimItem,
  createNewClaim1,
} = require("../../services/onec/claims");
const logger = require("../../logger");

const { v4: uuidv4 } = require("uuid");
const os = require("os");

// ---------- helpers ----------
const getIp = (req) => {
  const xf = req.headers["x-forwarded-for"];
  if (xf) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || req.ip || null;
};

const buildCtx = (req, extra = {}) => ({
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
  const { env, ...rest } = ctx || {};
  const ctxStr = `CTX=${JSON.stringify(rest)}`;
  return error?.stack ? `${error.stack}\n---\n${ctxStr}` : ctxStr;
};

const safeStringify = (obj) => {
  try { return JSON.stringify(obj); }
  catch {
    let cache = new Set();
    const res = JSON.stringify(obj, (k, v) => {
      if (typeof v === "object" && v !== null) {
        if (cache.has(v)) return "[Circular]";
        cache.add(v);
      }
      return v;
    });
    cache = null;
    return res;
  }
};

/**
 * @swagger
 * /api/cabinet/claims:
 *   post:
 *     summary: Создать новую заявку
 *     tags: ["🔒 Claims"]
 *     security: [ bearerAuth: [] ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Произвольный JSON с полями заявки
 *             example:
 *               serviceKey: "CONNECTION"
 *               description: "Хочу подключиться к сети"
 *               files: [ "a1b2c3d4-e5f6-7890" ]
 *     responses:
 *       200:
 *         description: Заявка создана
 *       500:
 *         description: Ошибка при создании заявки
 */


router.post("/", async (req, res) => {
  const userId = req.userId;
  const data = req.body || {};
  const requestId = uuidv4();
  const ctx = buildCtx(req, { scope: "claims.create", requestId, userId });

  logger.info(
    `[Claims] Входящий запрос на создание заявки от пользователя: ${userId}. Данные: ${safeStringify(data)}`,
    { stack: buildStack(ctx) }
  );

  try {
    const newClaim = await createNewClaim1(data, userId);

    const claimData = newClaim?.data?.data || {};
    const createdKey = claimData.Ref_key || claimData.Ref_Key || null;
    const createdNumber = claimData.number || claimData.Number || null;

    logger.info(
      `[Claims] Заявка успешно создана для пользователя: ${userId}. ` +
      (createdNumber ? `Номер: ${createdNumber}. ` : "") +
      (createdKey ? `Ключ: ${createdKey}. ` : "") +
      `Заявка содержит следующую информацию: ${safeStringify(data)}`,
      { stack: buildStack({ ...ctx, createdKey, createdNumber }) }
    );

    res.json(newClaim);
  } catch (error) {
    logger.error(
      `[Claims] Ошибка при создании заявки для пользователя ${userId}: ${error.message}`,
      { stack: buildStack(ctx, error) }
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при создании заявки",
      error: error.message,
    });
  }
});


/**
 * @swagger
 * /api/cabinet/claims:
 *   get:
 *     summary: Список заявок пользователя
 *     tags: ["🔒 Claims"]
 *     security: [ bearerAuth: [] ]
 *     responses:
 *       200:
 *         description: Массив заявок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: object }
 *       500:
 *         description: Ошибка при получении заявок
 */

router.get("/", async (req, res) => {
  const userId = req.userId;
  const page = req.query.page
  const size = req.query.size
  const requestId = uuidv4();
  const ctx = buildCtx(req, { scope: "claims.list", requestId, userId });

  try {
    const claims = await getClaims(userId, page, size);
    logger.info(
      `[Claims] Заявки пользователя ${userId} успешно получены`,
      { stack: buildStack({ ...ctx, count: Array.isArray(claims) ? claims.length : null }) }
    );
    res.json(claims);
  } catch (error) {
    logger.error(
      `[Claims] Ошибка при получении заявок для пользователя ${userId}: ${error.message}`,
      { stack: buildStack(ctx, error) }
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении заявок",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/cabinet/claims/{key}:
 *   get:
 *     summary: Детали конкретной заявки
 *     tags: ["🔒 Claims"]
 *     security: [ bearerAuth: [] ]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *         description: GUID заявки
 *     responses:
 *       200: { description: Заявка найдена }
 *       500: { description: Ошибка при получении заявки }
 */


router.get("/:key", async (req, res) => {
  const userId = req.userId;
  const key = encodeURIComponent(req.params.key);
  const dataSet = req.query.dataSet  
  const requestId = uuidv4();
  const ctx = buildCtx(req, { scope: "claims.item", requestId, userId, key });

  try {
    const claim = await getClaimItem(userId, key, dataSet);
    logger.info(
      `[Claims] Заявка ${key} успешно получена для пользователя ${userId}`,
      { stack: buildStack(ctx) }
    );
    res.json(claim);
  } catch (error) {
    logger.error(
      `[Claims] Ошибка при получении заявки с ключом ${key}: ${error.message}`,
      { stack: buildStack(ctx, error) }
    );
    res.status(500).json({
      status: "error",
      message: "Ошибка при получении заявки",
      error: error.message,
    });
  }
});

module.exports = router;
