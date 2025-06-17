const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

/* ───────────── Заголовок / описание ───────────── */
const API_TITLE = "МосОблЭнерго API";
const API_DESCRIPTION = `
* 🔒 **Приватные** — требуют JWT  
* 🌐 **Публичные** — доступны без авторизации  

#### Как авторизоваться
1. В разделе **🌐 Auth → /api/auth/login** выполните шаги авторизации  
   (email + пароль, затем SMS-код).  
2. В ответе придёт поле \`jwt\`. Скопируйте его.  
3. Нажмите зелёную кнопку **Authorize** вверху справа.  
4. В форме *bearerAuth* **вставьте токен целиком** (без слова *Bearer*).  
5. Нажмите **Authorize** → затем **Close**.  
   Теперь все 🔒 эндпоинты будут выполняться от имени пользователя.

Кнопка **Execute** предназначена для тестового окружения (dev).  
`;

/* ───────────── OpenAPI ───────────── */
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: API_TITLE,
      version: "2.3.3",
      description: API_DESCRIPTION,
    },

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Вставляйте **только** сам токен, без слова “Bearer”.",
        },
      },
    },

    tags: [
      { name: "🔒 Profile", description: "Профиль пользователя" },
      { name: "🔒 Files", description: "Загрузка и получение файлов" },
      { name: "🔒 Documents", description: "Документы пользователя" },
      { name: "🔒 Claims", description: "Заявки / обращения" },
      { name: "🔒 PersonalAccounts", description: "Лицевые счета" },
      { name: "🔒 Payments", description: "Платёжные операции" },

      { name: "🌐 Auth", description: "Авторизация" },
      { name: "🌐 Registration", description: "Регистрация" },
      { name: "🌐 Services", description: "Справочник услуг" },
      { name: "🌐 DaData", description: "Интеграция DaData" },
      { name: "🌐 HotQuestions", description: "Частые вопросы" },
      { name: "🌐 Contact", description: "Контактная информация" },
      { name: "🌐 GigaChat", description: "GigaChat API" },
    ],
  },

  apis: [
    "./routers/*.js",
    "./routers/getDaData/*.js",
    "./routers/cabinet/**/*.js",
  ],

};

const specs = swaggerJsdoc(options);

/* ───────────── Swagger-UI ───────────── */
const uiOptions = {

  customSiteTitle: API_TITLE,

  /* убираем только пустой топ-отступ, Authorize оставляем */
  customCss: `
    .topbar { padding: 0 !important; }
  `,

  swaggerOptions: {
    docExpansion: "list",
    persistAuthorization: true,
    displayRequestDuration: true,
  },
};
module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, uiOptions));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

// const swaggerJsdoc = require("swagger-jsdoc");
// const swaggerUi = require("swagger-ui-express");

// const options = {
//   definition: {
//     openapi: "3.0.0",
//     info: {
//       title: "МосОблЭнерго API",
//       version: "2.0.0",
//       description: `Добро пожаловать в документацию API проекта МосОблЭнерго.

// Здесь вы найдете описание всех доступных маршрутов и методов взаимодействия с сервером.

// Чтобы использовать документацию:

// 1. Запустите сервер и перейдите по адресу '/api-docs'.
// 2. Выберите интересующий вас маршрут и ознакомьтесь с параметрами запроса и ответов.
// 3. Используйте "Try it out", чтобы отправить тестовый запрос.
// 4. Нажмите "Execute" и получите ответ от API.

// Если возникнут сложности, проверьте правильность введенных параметров и повторите попытку.

// Желаем продуктивной работы!`,
//     },
//     tags: [
//       { name: "Auth", description: "Авторизация пользователей" },
//       {
//         name: "Registration",
//         description: "Регистрация и подтверждение пользователей",
//       },
//       { name: "Services", description: "Информация об услугах и их элементах" },
//       { name: "SendMail", description: "Отправка кода подтверждения на email" },
//       { name: "Claims", description: "Заявки пользователей в личном кабинете" },
//       { name: "Documents", description: "Работа с документами пользователей" },
//       { name: "UploadFile", description: "Загрузка файлов" },
//       { name: "Profile", description: "Управление профилем пользователя" },
//       { name: "DaData", description: "Работа с API DaData" },
//       { name: "Formonec", description: "Работа с формами 1С" },
//       { name: "GigaChat", description: "Взаимодействие с GigaChat API" },
//       {
//         name: "HotQuestions",
//         description: "Получение частых вопросов и ответов",
//       },
//       { name: "Contact", description: "Контактная информация из 1С" },
//       {
//         name: "Payments",
//         description: "Маршруты для оплаты через ВТБ и Сбербанк",
//       },
//     ],
//   },
//   apis: [
//     "./routers/*.js",
//     "./routers/getDaData/*.js",
//     "./routers/cabinet/*.js",
//   ],
// };

// const specs = swaggerJsdoc(options);

// module.exports = (app) => {
//   app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
// };
