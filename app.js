const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");
const http = require("http");
const https = require("https");
require("dotenv").config();
const logger = require("./logger");

const auth = require("./routers/auth");
const registration = require("./routers/registration");
const sendMail = require("./routers/sendmail");
const cabinet = require("./routers/cabinet");
const services = require("./routers/services");
const servicestest = require("./routers/servicestest");
const formonec = require("./routers/formonec");

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
app.use("/api/servicestest", servicestest);
app.use("/api/formonec", formonec);

const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);

httpServer.listen(port, () => {
  console.log(`Зашли и вышли, приключения на ${port} порту`);
});
httpsServer.listen(portSSL);

// const express = require("express");
// const helmet = require("helmet");
// const cors = require("cors");
// const fs = require("fs");
// const http = require("http");
// const https = require("https");
// require("dotenv").config();
// const logger = require("./logger");

// const auth = require("./routers/auth");
// const registration = require("./routers/registration");
// const sendMail = require("./routers/sendmail");
// const cabinet = require("./routers/cabinet");
// const services = require("./routers/services");
// const servicestest = require("./routers/servicestest");
// const formonec = require("./routers/formonec");

// const session = require("express-session");

// const bodyParser = require("body-parser");
// const fileUpload = require("express-fileupload");
// const FileStore = require("session-file-store")(session);

// const checkAuth = require("./middleware/checkAuth");

// const secretSession = process.env.SECRET_SESSION;
// const port = process.env.PORT;
// const portSSL = process.env.PORT_SSL;
// const cert = process.env.CERT;
// const certKey = process.env.CERT_KEY;

// const options = {
//   cert: fs.readFileSync(cert),
//   key: fs.readFileSync(certKey),
// };

// const app = express();
// app.use(cors({ credentials: true, origin: true }));
// app.use(
//   session({
//     cookie: {
//       httpOnly: true,
//       maxAge: 100000,
//       sameSite: "none",
//       domain: "luxeivan.ru",
//       secure: true,
//     },
//     store: new FileStore({ retries: 1 }),
//     secret: secretSession,
//     // Опция resave: false говорит, что сессия не должна быть сохранена заново,
//     // если она не изменялась в ходе запроса, что уменьшает количество операций записи.
//     resave: false,
//     // Опция saveUninitialized: false говорит, что сессия не будет сохраняться,
//     // если она не инициализирована (т.е., не была изменена), что снижает нагрузку
//     // на хранилище сессий и предотвращает ненужные операции записи.
//     saveUninitialized: false,
//   })
// );

// app.use(bodyParser.json());
// app.use(
//   fileUpload({
//     limits: { fileSize: 50 * 1024 * 1024 },
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//   })
// );

// // Middleware для логирования ошибок
// app.use((err, req, res, next) => {
//   logger.error(err.stack);
//   res.status(500).send("Морти, у нас что-то сломалось!");
// });

// // Использование всех модулей Helmet
// app.use(helmet());

// // Настройка Content Security Policy
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "trusted-scripts.com"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       imgSrc: ["'self'", "data:"],
//       connectSrc: ["'self'", "api.trusted.com"],
//       fontSrc: ["'self'", "fonts.googleapis.com"],
//       objectSrc: ["'none'"],
//       mediaSrc: ["'self'"],
//       frameSrc: ["'none'"],
//     },
//   })
// );

// // Настройка Referrer Policy
// app.use(helmet.referrerPolicy({ policy: "same-origin" }));

// // Маршруты вашего приложения
// app.get("/", (req, res) => {
//   res.send("Hello, World!");
// });

// //app.use(express.urlencoded({ extended: true }));

// app.use("/api/auth", auth);
// app.use("/api/registration", registration);
// // app.use('/api/sendmail', sendMail)
// app.use("/api/cabinet", checkAuth, cabinet);
// app.use("/api/services", services);
// app.use("/api/servicestest", servicestest);
// app.use("/api/formonec", formonec);

// const httpServer = http.createServer(app);
// const httpsServer = https.createServer(options, app);
// httpServer.listen(port, () => {
//   console.log(`Зашли и вышли, приключения на ${port} порту`);
// });
// httpsServer.listen(portSSL);
