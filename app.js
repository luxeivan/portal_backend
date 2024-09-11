const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");
const http = require("http");
const https = require("https");
require("dotenv").config();
const logger = require("./logger");
const rateLimit = require("express-rate-limit");
const swaggerSetup = require('./swagger');

const auth = require("./routers/auth");
const registration = require("./routers/registration");
const sendMail = require("./routers/sendmail");
const cabinet = require("./routers/cabinet");
const services = require("./routers/services");
const formonec = require("./routers/formonec");
const getDaData = require('./routers/getDaData/getDaData');
const contactRouter = require('./routers/contact')

const session = require("express-session");

const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const FileStore = require("session-file-store")(session);

const checkAuth = require("./middleware/checkAuth");

const secretSession = process.env.SECRET_SESSION;
const port = process.env.PORT;
const portSSL = process.env.PORT_SSL;
const cert = process.env.CERT;
const certKey = process.env.CERT_KEY;



const options = {
  cert: fs.readFileSync(cert),
  key: fs.readFileSync(certKey),
};

const app = express();
app.use(cors({ credentials: true, origin: true }));
app.use(
  session({
    cookie: {
      httpOnly: true,
      maxAge: 100000,
      sameSite: "none",
      domain: "luxeivan.ru",
      secure: true,
    },
    store: new FileStore({ retries: 1 }),
    secret: secretSession,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(bodyParser.json());
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);


// Настраиваем rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // лимит каждого IP до 1000 запросов !!!!СДЕЛАЛ БОЛЬШЕ!!!!!
  message: "Слишком много запросов с этого IP, пожалуйста, попробуйте позже.",
});

// Применяем rate limiter ко всем запросам
app.use(limiter);

// Использование всех модулей Helmet
app.use(helmet());

// Настройка Content Security Policy
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"], // Разрешает загрузку контента только с текущего домена.
      scriptSrc: ["'self'", "trusted-scripts.com"], // Разрешает выполнение скриптов только с текущего домена и trusted-scripts.com.
      styleSrc: ["'self'", "'unsafe-inline'"], // Разрешает стили только с текущего домена и использование inline-стилей (не рекомендуется, но может быть необходимо).
      imgSrc: ["'self'", "data:"], // Разрешает загрузку изображений только с текущего домена и data URI (для встраивания изображений в HTML).
      connectSrc: ["'self'", "api.trusted.com"], // Разрешает соединения (например, AJAX-запросы) только с текущего домена и api.trusted.com.
      fontSrc: ["'self'", "fonts.googleapis.com"], // Разрешает загрузку шрифтов только с текущего домена и fonts.googleapis.com.
      objectSrc: ["'none'"], // Запрещает загрузку плагинов (например, Flash).
      mediaSrc: ["'self'"], // Разрешает загрузку медиа-контента только с текущего домена.
      frameSrc: ["'none'"], // Запрещает встраивание вашего сайта в iframe на других сайтах (предотвращает clickjacking).
    },
  })
);

// Настройка Referrer Policy
app.use(helmet.referrerPolicy({ policy: "same-origin" }));

// Маршруты вашего приложения
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/api/auth", auth);
app.use("/api/registration", registration);
app.use("/api/cabinet", checkAuth, cabinet);
app.use("/api/services", services);
app.use("/api/formonec", formonec);
app.use('/api/getDaData', getDaData);
app.use('/api/contacts', contactRouter);

swaggerSetup(app);

const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);

httpServer.listen(port, () => {
  console.log(`Зашли и вышли, приключения на ${port} порту`);
});
httpsServer.listen(portSSL);