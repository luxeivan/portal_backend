const express = require("express");
const cors = require("cors");
const fs = require("fs");
const http = require("http");
const https = require("https");
require("dotenv").config();

const auth = require("./routers/auth");
const registration = require("./routers/registration");
const sendMail = require("./routers/sendmail");
const cabinet = require("./routers/cabinet");
const services = require("./routers/services");
const formonec = require("./routers/formonec");

const session = require("express-session");

const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const FileStore = require("session-file-store")(session);

const checkAuth = require("./middleware/checkAuth");


const secretSession = process.env.SECRET_SESSION;
const port = process.env.PORT;
// const portSSL = process.env.PORT_SSL;
// const cert = process.env.CERT;
// const certKey = process.env.CERT_KEY;

// const options = {
//   cert: fs.readFileSync(cert),
//   key: fs.readFileSync(certKey),
// };


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
    // Опция resave: false говорит, что сессия не должна быть сохранена заново,
    // если она не изменялась в ходе запроса, что уменьшает количество операций записи.
    resave: false,
    // Опция saveUninitialized: false говорит, что сессия не будет сохраняться,
    // если она не инициализирована (т.е., не была изменена), что снижает нагрузку
    // на хранилище сессий и предотвращает ненужные операции записи.
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

//app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", auth);
app.use("/api/registration", registration);
// app.use('/api/sendmail', sendMail)
app.use("/api/cabinet", checkAuth, cabinet);
app.use("/api/services", services);
app.use("/api/formonec", formonec);

const httpServer = http.createServer(app);
// const httpsServer = https.createServer(options, app);
httpServer.listen(port, () => {
  console.log(`Зашли и вышли, приключения на ${port} порту`);
});
// httpsServer.listen(portSSL);
