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

// Функция для записи логов в базу данных
const saveLogToDatabase = async (level, message, timestamp, stack) => {
  try {
    await Log.create({ level, message, timestamp, stack });
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
    format.timestamp(),
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

// Логируем в базу данных
logger.on("data", (log) => {
  const { level, message, timestamp, stack } = log;
  saveLogToDatabase(level, message, timestamp, stack);
});

module.exports = logger;

// const { createLogger, format, transports } = require('winston');
// require('winston-daily-rotate-file');
// const moment = require('moment-timezone');

// const timezone = 'Europe/Moscow';

// const logFormat = format.printf(({ level, message, timestamp, stack }) => {
//   const formattedTimestamp = moment(timestamp).tz(timezone).format('HH:mm DD.MM.YYYY');
//   return `${formattedTimestamp} ${level}: ${stack || message}`;
// });

// const dailyRotateFileTransport = new transports.DailyRotateFile({
//   filename: 'logs/error-%DATE%.log',
//   datePattern: 'YYYY-MM-DD',
//   zippedArchive: true,
//   maxSize: '20m',
//   maxFiles: '30d',
//   level: 'error',
// });

// const logger = createLogger({
//   level: 'info',
//   format: format.combine(
//     format.timestamp(),
//     format.errors({ stack: true }),
//     format.splat(),
//     logFormat
//   ),
//   defaultMeta: { service: 'user-service' },
//   transports: [
//     new transports.File({ filename: 'logs/combined.log' }),
//     dailyRotateFileTransport
//   ],
// });

// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new transports.Console({
//     format: format.simple(),
//   }));
// }

// module.exports = logger;
