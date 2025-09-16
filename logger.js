const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const moment = require("moment-timezone");
const Log = require("./services/db/models/Log");

const timezone = "Europe/Moscow";

// ОПРЕДЕЛЯЕМ ТЕКУЩЕЕ ОКРУЖЕНИЕ (берём из .env)
const portalEnv = (
  process.env.PORTAL_ENV ||
  process.env.VITE_BACK_VERSION ||
  process.env.NODE_ENV ||
  "local"
).toLowerCase();

const logFormat = format.printf(({ level, message, timestamp, stack }) => {
  const ts = moment(timestamp).tz(timezone).format("HH:mm DD.MM.YYYY");
  // Добавляем префикс окружения в каждую строку лога
  return `${ts} [${portalEnv}] ${level}: ${stack || message}`;
});

// Запись лога в БД (включая env)
const saveLogToDatabase = async (
  level,
  message,
  timestamp,
  stack,
  env = portalEnv
) => {
  try {
    // сохраняем в БД в МСК (без UTC-смещения)
    const localTimestamp = moment
      .tz(timestamp, timezone)
      .format("YYYY-MM-DD HH:mm:ss");
    await Log.create({ level, message, timestamp: localTimestamp, stack, env });
    console.log("Log saved to the database");
  } catch (error) {
    console.error("Failed to save log to the database", error);
  }
};

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: `logs/${portalEnv}-error-%DATE%.log`, // разные файлы для разных сред
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
  level: "error",
});

const logger = createLogger({
  level: "info",
  format: format.combine(
    format((info) => {
      info.timestamp = moment().tz(timezone).format();
      return info;
    })(),
    format.errors({ stack: true }),
    format.splat(),
    logFormat
  ),
  defaultMeta: { service: "user-service", env: portalEnv },
  transports: [
    new transports.File({ filename: `logs/${portalEnv}-combined.log` }),
    dailyRotateFileTransport,
  ],
});

// В DEV — дублируем в консоль
if (process.env.NODE_ENV !== "production") {
  logger.add(new transports.Console({ format: format.simple() }));
}

// При каждом лог-сообщении пишем запись в БД
logger.on("data", (log) => {
  const { level, message, timestamp, stack } = log;
  saveLogToDatabase(level, message, timestamp, stack, portalEnv).catch(
    () => {}
  );
});

module.exports = logger;
