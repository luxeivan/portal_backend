const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const moment = require("moment-timezone");
const Log = require("./services/db/models/Log");
const Transport = require("winston-transport");
const { default: axios } = require("axios");

const timezone = "Europe/Moscow";
const devLocal = process.env.DEV_LOCAL;
const SERVER_1C_HTTP_SERVICE = process.env.SERVER_1C_HTTP_SERVICE;
const server1c_auth = process.env.SERVER_1C_AUTHORIZATION;
const headers = {
  Authorization: server1c_auth,
  "Content-Type": "application/json",
};

const portalEnv = (
  process.env.PORTAL_ENV ||
  process.env.VITE_BACK_VERSION ||
  process.env.NODE_ENV ||
  "local"
).toLowerCase();

const logFormat = format.printf(({ level, message, timestamp, stack }) => {
  const ts = moment(timestamp).tz(timezone).format("HH:mm DD.MM.YYYY");
  return `${ts} [${portalEnv}] ${level}: ${stack || message}`;
});

const saveLogToDatabase = async (
  level,
  message,
  timestamp,
  stack,
  env = portalEnv
) => {
  if (devLocal !== '1') {

    try {
      const localTimestamp = moment
        .tz(timestamp, timezone)
        .format("YYYY-MM-DD HH:mm:ss");
      await Log.create({ level, message, timestamp: localTimestamp, stack, env });
      // console.log("Log saved to the database");
    } catch (error) {
      console.error("Failed to save log to the database", error);
    }
  }
};

class SequelizeTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
    this.env = opts.env || portalEnv;
  }

  log(info, callback) {
    setImmediate(() => this.emit("logged", info));

    const { level, message, stack } = info;
    const timestamp = info.timestamp || moment().tz(timezone).format();

    const safeMessage =
      typeof message === "string"
        ? message.slice(0, 4000)
        : String(message).slice(0, 4000);

    const safeStack =
      typeof stack === "string"
        ? stack.slice(0, 8000)
        : stack
          ? String(stack).slice(0, 8000)
          : null;

    saveLogToDatabase(level, safeMessage, timestamp, safeStack, this.env)
      .catch(() => { })
      .finally(() => callback());

    if (level !== "info") {
      let url = "errorPortal"
      if (level === "warning") {
        url = "warningPortal"
      }
      axios.post(`${SERVER_1C_HTTP_SERVICE}/profile/00000000-0000-0000-0000-000000000000/${url}`,
        {
          level,
          safeMessage,
          timestamp,
          safeStack,
          env: this.env
        },
        {
          headers
        })
        .then(res => {
          console.log("res", res);
        })
        .catch(err => {
          console.log(err);
        })
    }

  }
}

const dailyRotateFileTransport = new transports.DailyRotateFile({
  filename: `logs/${portalEnv}-error-%DATE%.log`,
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
    new SequelizeTransport({ env: portalEnv }),
  ],
});

// В DEV — дублируем в консоль
if (process.env.NODE_ENV !== "production") {
  logger.add(new transports.Console({ format: format.simple() }));
}


module.exports = logger;
