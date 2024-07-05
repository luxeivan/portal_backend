const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const moment = require('moment');

const logFormat = format.printf(({ level, message, timestamp, stack }) => {
  const formattedTimestamp = moment(timestamp).format('HH:mm DD.MM.YYYY');
  return `${formattedTimestamp} ${level}: ${stack || message}`;
});

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    logFormat
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new transports.File({ filename: 'logs/combined.log' }),
    dailyRotateFileTransport
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple(),
  }));
}

module.exports = logger;
