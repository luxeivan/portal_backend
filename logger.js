const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const moment = require("moment-timezone");
const Log = require("./services/db/models/Log");

const timezone = "Europe/Moscow";

const logFormat = format.printf(({ level, message, timestamp, stack }) => {
  const formattedTimestamp = moment(timestamp)
    .tz(timezone)
    .format("HH:mm DD.MM.YYYY");
  return `${formattedTimestamp} ${level}: ${stack || message}`;
});

// Функция для записи логов в базу данных с корректировкой времени
const saveLogToDatabase = async (level, message, timestamp, stack) => {
  try {
    const utcTimestamp = moment.utc(timestamp).format("YYYY-MM-DD HH:mm:ss"); // Преобразуем в UTC формат для базы данных
    await Log.create({ level, message, timestamp: utcTimestamp, stack });
    console.log("Log saved to the database");
  } catch (error) {
    console.error("Failed to save log to the database", error);
  }
};


const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: "logs/error-%DATE%.log",
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
  defaultMeta: { service: "user-service" },
  transports: [
    new transports.File({ filename: "logs/combined.log" }),
    dailyRotateFileTransport,
  ],
});

// Добавляем логи в консоль при разработке
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.simple(),
    })
  );
}

// Логируем в базу данных с защитой от ошибок подключения к БД
logger.on("data", (log) => {
  const { level, message, timestamp, stack } = log;
  try {
    saveLogToDatabase(level, message, timestamp, stack);
  } catch (error) {
    console.error(
      "Ошибка записи в базу данных"
    );
  }
});

module.exports = logger;
