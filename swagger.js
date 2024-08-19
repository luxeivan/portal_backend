const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "МосОблЭнерго API",
      version: "1.0.0",
      description: `
  Как пользоваться этой чудо-документацией, и заставить API работать на тебя? Ладно, давай по порядку, блестящий ты наш программист.

  1. **Запусти этот шедевр**: Вбей в браузере '/api-docs' после запуска сервера. Нет, серьёзно, это всё, что тебе нужно. Если ты не можешь с этим справиться, то, возможно, пора пересмотреть свои жизненные приоритеты.

  2. **Маршруты и кнопочки**: Нашел маршрут? Открывай его, чтобы посмотреть на все эти блестящие параметры и возможности. Не бойся, он не укусит. Ну, не сразу.

  3. **Проверь параметры**: Думаешь, что всё легко и просто? Ха! Проверь тело запроса, параметры и заголовки перед тем, как что-то нажимать. Поверь, это спасет тебя от позора... ну, или хотя бы от лишних ошибок.

  4. **"Try it out" — время показать, на что ты способен**: Нажимай эту кнопку и вводи свои данные. Давай, удиви меня! Если у тебя получится, возможно, где-то в параллельной вселенной кто-то даже слегка улыбнется.

  5. **Execute — волшебная кнопка**: Нажал "Execute"? Отлично, теперь жди, как ждёшь чуда в пятницу вечером. Если что-то пошло не так — это просто ещё один день в жизни программиста, ничего нового.

  6. **Разберись с результатами**: Swagger покажет тебе, что API выдал в ответ. Статус-код, тело ответа — вот это всё. Если всё прошло гладко — поздравляю, ты не испортил это. Если нет — возвращайся к пункту 3 и разбирайся, где ты опять накосячил.

  7. **Повтори всё снова**: Если что-то сработало, двигайся к следующему маршруту. Если нет — попробуй ещё раз, пока не добьешься успеха или пока не сойдёшь с ума. Выбор за тобой.

  И да, если что-то не сработало — это не моя проблема, так что соберись и сделай всё правильно с первого раза, или хотя бы с пятого. Удачи, она тебе явно понадобится.
`,
    },
    tags: [
      {
        name: "Auth",
        description: "Маршруты для авторизации пользователей",
      },
      {
        name: "Formonec",
        description: "Маршруты для работы с формами в 1С",
      },
      {
        name: "Registration",
        description: "Маршруты для регистрации и подтверждения пользователей",
      },
      {
        name: "SendMail",
        description: "Маршруты для отправки кода на email",
      },
      {
        name: "Services",
        description:
          "Маршруты для получения информации об услугах и их элементах",
      },
      {
        name: "Claims",
        description:
          "Маршруты для работы с заявками пользователей в личном кабинете",
      },
      {
        name: "Documents",
        description: "Маршруты для работы с документами пользователей",
      },
      {
        name: "UploadFile",
        description: "Маршруты для загрузки файлов",
      },
      {
        name: "Objects (ПОКА НЕ ИСПОЛЬЗУЕМ)",
        description: "Маршруты для управления объектами пользователей",
      },
      {
        name: "Subjects (ПОКА НЕ ИСПОЛЬЗУЕМ)",
        description: "Маршруты для управления субъектами",
      },  
      {
        name: "Profile",
        description: "Маршруты для управления профилем пользователя",
      }, 
      {
        name: "DaData",
        description: "Маршруты для работы с API DaData",
      },
    ],
  },
  apis: [
    "./routers/*.js",
    "./routers/getDaData/*.js",
    "./routers/cabinet/*.js",
  ], // путь к файлам с описанием API
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};