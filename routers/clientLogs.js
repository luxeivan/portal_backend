const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const logger = require("../logger");

// Ограничения и безопасные хелперы, чтобы фронт не мог раздуть логи/БД
const BODY_LIMIT = "32kb";
const MAX_STR_LEN = 4000;
const MAX_META_LEN = 2000;

function toSafeString(v, max = MAX_STR_LEN) {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : String(v);
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function safeJson(obj, max = MAX_META_LEN) {
  try {
    const s = JSON.stringify(obj);
    return s.length > max ? s.slice(0, max) + "…" : s;
  } catch {
    return "[unserializable]";
  }
}

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });

// Локальный json-парсер с лимитом (даже если глобально уже подключён — не мешает)
router.use(express.json({ limit: BODY_LIMIT }));
router.use(limiter);

router.post("/", (req, res) => {
  try {
    const body = req.body || {};
    const rawLevel = (body.level || "info").toString().toLowerCase();
    const safeLevel = ["error", "warn", "info"].includes(rawLevel)
      ? rawLevel
      : "info";

    const event = toSafeString(body.event || "frontend", 120);
    const message = toSafeString(body.message || "", MAX_STR_LEN);

    // details может быть чем угодно — приводим к объекту и ограничиваем
    const details =
      body.details && typeof body.details === "object" ? body.details : {};

    const payload = {
      from: "frontend",
      event,
      ...details,
    };

    const meta = safeJson(payload, MAX_META_LEN);

    logger.log({
      level: safeLevel,
      message: `FE ${event}: ${message} | meta=${meta}`,
    });

    return res.json({ status: "ok" });
  } catch (e) {
    logger.error(`FE log endpoint error: ${e.message}`);
    return res.status(500).json({ status: "error" });
  }
});

module.exports = router;
