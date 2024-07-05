const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const sendCodeToMail = require("../services/sendCodeToMail");
const sendCodeToPhone = require("../services/sendCodeToPhone");
const {
  createNewUser,
  updateUser,
  checkUserByEmail,
} = require("../services/onec/users");
const logger = require("../logger");

const privateKey = process.env.JWT_SECRET;

const attempts = 3; //Количество попыток
const timeAttempts = 5; //Время попыток

//Прием телефона и звонок с кодом------------------------------------------------------------------------------
router.post("/phone", async (req, res) => {
  //Если нет поле phone
  //console.log(req.body)
  if (!req.body.phone) {
    logger.error("Отсутствует поле 'phone' в теле запроса");
    return res.json({ status: "error", message: "нет нужной информации" });
  }
  //Если телефон уже подтвержден
  if (req.session.phoneCheck) {
    logger.error("Номер телефона уже подтвержден");
    return res.json({ status: "error", message: "телефон уже подтвержден" });
  }

  //Проверяем время попыток
  if (req.session.phoneBlock) {
    logger.error("Запрос на подтверждение телефона отправлен слишком часто");
    return res.json({
      status: "unavailable",
      message: "нельзя часто отправлять запросы на подтверждение телефона",
    });
  }
  req.session.phone = req.body.phone; //Запись телефона в сессию
  req.session.phoneCheck = false; //Запись телефон не проверен в сессию
  req.session.phoneCount = attempts; //Запись количества попыток проверки в сессию

  //Пытаемся отправить код на телефон
  try {
    const code = await sendCodeToPhone(req.body.phone);
    logger.info(
      `Код подтверждения отправлен на номер телефона: ${req.body.phone}, код: ${code}`
    );
    //console.log('code', code)
    //Блокируем на время
    req.session.phoneBlock = true;
    setTimeout(() => {
      req.session.phoneBlock = false;
    }, timeAttempts);

    req.session.phoneCode = code; //Запись правильного кода проверки в сессию

    return res.json({ status: "ok", phoneCount: req.session.phoneCount });
  } catch (error) {
    logger.error(`Ошибка при отправке кода подтверждения: ${error.message}`);
    //console.log(error.message)
    return res
      .status(500)
      .json({ status: "error", message: "ошибка отправки кода" });
  }
});

//Проверка кода из звонка с кодом введенным пользователем------------------------------------------------------------------------------
router.post("/phonecode", async (req, res) => {
  //Если нет поле phoneCode
  if (!req.body.phoneCode) {
    logger.error("Отсутствует поле 'phoneCode' в теле запроса");
    return res.json({ status: "error", message: "нет нужной информации" });
  }
  //Если телефон уже подтвержден
  if (req.session.phoneCheck) {
    logger.info("Номер телефона уже подтвержден");
    return res.json({ status: "error", message: "телефон уже подтвержден" });
  }
  //Если количество попыток завершилось обнуляем сессию
  if (req.session.phoneCount <= 0) {
    logger.warn("Закончились попытки подтверждения телефона");
    req.session.destroy();
    return res.json({
      status: "error",
      message: "закончились попытки подтверждения телефона",
    });
  }
  //Сравниваем пришедший код и код из сессии если совпадает то подтверждаем проверку телефона
  logger.info(
    `Полученный код: ${req.body.phoneCode}, ожидаемый код: ${req.session.phoneCode}`
  );
  if (req.body.phoneCode == req.session.phoneCode) {
    req.session.phoneCheck = true;
    req.session.phoneCount = 0;
    logger.info("Номер телефона подтвержден");
    return res.json({ status: "ok", message: "телефон подтвержден" });
  } else {
    req.session.phoneCount = req.session.phoneCount - 1;
    logger.warn(
      `Неверный код, оставшееся количество попыток: ${req.session.phoneCount}`
    );
    return res.json({
      status: "error",
      message: "неверный код",
      phoneCount: req.session.phoneCount,
    });
  }
});

//Прием email и отправка письма с кодом на почту------------------------------------------------------------------------------
router.post("/email", async (req, res) => {
  //Если нет поле email
  logger.info(
    `Получен запрос на подтверждение email: ${JSON.stringify(req.body)}`
  );
  if (!req.body.email) {
    logger.error("Отсутствует поле 'email' в теле запроса");
    return res.json({ status: "error", message: "нет нужной информации" });
  }

  //Если email уже подтвержден
  if (req.session.emailCheck) {
    logger.info("Email уже подтвержден");
    return res.json({ status: "error", message: "email уже подтвержден" });
  }

  //Проверяем подтвержден ли телефон
  if (!req.session.phoneCheck) {
    logger.warn("Сначала необходимо подтвердить номер телефона");
    return res.json({
      status: "error",
      message: "вначале нужно подтвердить телефон",
    });
  }

  //Проверяем время попыток
  if (req.session.emailBlock) {
    logger.warn("Слишком частые запросы на подтверждение email");
    return res.json({
      status: "unavailable",
      message: "нельзя часто отправлять запросы на подтверждение email",
    });
  }

  req.session.email = req.body.email.toLowerCase(); //Запись email в сессию
  req.session.emailCheck = false; //Запись email не проверен в сессию
  req.session.emailCount = attempts; //Запись количества попыток проверки в сессию

  //Пытаемся отправить код на email
  try {
    const code = await sendCodeToMail(req.body.email);
    logger.info(`Код подтверждения отправлен на email: ${req.body.email}`);

    //Блокируем на время
    req.session.emailBlock = true;
    setTimeout(() => {
      req.session.emailBlock = false;
    }, timeAttempts);

    req.session.emailCode = code; //Запись правильного кода проверки в сессию

    return res.json({ status: "ok", emailcount: req.session.emailCount });
  } catch (error) {
    logger.error(
      `Ошибка при отправке кода подтверждения на email: ${error.message}`
    );
    return res
      .status(500)
      .json({ status: "error", message: "ошибка отправки кода" });
  }
});

//Проверка кода из письма с кодом введенным пользователем------------------------------------------------------------------------------
router.post("/emailcode", async (req, res) => {
  //Если нет поле emailCode
  logger.info(
    `Получен запрос на подтверждение email-кода: ${JSON.stringify(req.body)}`
  );
  if (!req.body.emailCode) {
    logger.error("Отсутствует поле 'emailCode' в теле запроса");
    return res.json({ status: "error", message: "нет нужной информации" });
  }

  //Если email уже подтвержден
  if (req.session.emailCheck) {
    logger.info("Email уже подтвержден");
    return res.json({ status: "error", message: "email уже подтвержден" });
  }

  //Если количество попыток завершилось обнуляем сессию
  if (req.session.emailCount == 0) {
    logger.warn("Закончились попытки подтверждения email");
    req.session.destroy();
    return res.json({
      status: "error",
      message: "закончились попытки подтверждения телефона",
    });
  }

  //Сравниваем пришедший код и код из сессии если совпадает то подтверждаем проверку телефона
  if (req.body.emailCode == req.session.emailCode) {
    req.session.emailCheck = true;
    req.session.emailCount = 0;
    logger.info("Email успешно подтвержден");
    return res.json({ status: "ok", message: "телефон подтвержден" });
  } else {
    req.session.emailCount = req.session.emailCount - 1;
    logger.warn("Неверный код подтверждения email");
    return res.json({
      status: "error",
      message: "неверный код",
      emailCount: req.session.emailCount,
    });
  }
});

//Проверка подтверждения почты и телефона, получение пароля от пользователя и запись нового пользователя в базу------------------------------------------------------------------------------
router.post("/newuser", async (req, res) => {
  logger.info(
    `Получен запрос на создание нового пользователя: ${JSON.stringify(
      req.body
    )}`
  );

  // Если нет поле password
  if (!req.body.password) {
    logger.error("Отсутствует поле 'password' в теле запроса");
    return res.json({ status: "error", message: "нет нужной информации" });
  }

  // Проверка подтвержден ли email и телефон
  if (!req.session.emailCheck || !req.session.phoneCheck) {
    logger.warn("Не вся информация подтверждена");
    return res.json({
      status: "error",
      message: "не вся информация подтверждена",
    });
  }

  // Проверка на существование пользователя
  const checkUser = await checkUserByEmail(req.session.email);
  if (checkUser) {
    // Обновление пароля и телефона пользователя с указанным email
    try {
      const user = await updateUser(
        checkUser,
        req.session.phone,
        req.body.password
      );
      logger.info(`Пользователь найден и обновлен: ${user.Email}`);
      req.session.destroy();
      const userjwt = jwt.sign(
        { id: user.Ref_Key, email: user.Email, phone: user.Phone },
        privateKey,
        { expiresIn: `${process.env.JWT_LIVE_HOURS}h` }
      );
      return res.json({ status: "ok", jwt: userjwt });
    } catch (error) {
      logger.error(`Ошибка обновления пользователя: ${error.message}`);
      return res.status(500).json({
        status: "error",
        message: "ошибка обновления пользователя",
        error: error.message,
      });
    }
  } else {
    // Создание нового пользователя
    try {
      const newuser = await createNewUser(
        req.session.email,
        req.session.phone,
        req.body.password
      );
      logger.info(`Создан новый пользователь: ${newuser.Email}`);
      req.session.destroy();
      const userjwt = jwt.sign(
        { id: newuser.Ref_Key, email: newuser.Email, phone: newuser.Phone },
        privateKey,
        { expiresIn: `${process.env.JWT_LIVE_HOURS}h` }
      );
      return res.json({ status: "ok", jwt: userjwt });
    } catch (error) {
      logger.error(`Ошибка создания пользователя: ${error.message}`);
      return res.status(500).json({
        status: "error",
        message: "ошибка создания пользователя",
        error: error.message,
      });
    }
  }
});

//Сброс сессии по запросу от клиента------------------------------------------------------------------------------
router.post("/clearinfo", async (req, res) => {
  logger.info("Получен запрос на очистку информации и завершение сессии");

  req.session.destroy((err) => {
    if (err) {
      logger.error(`Ошибка при завершении сессии: ${err.message}`);
      return res.status(500).json({
        status: "error",
        message: "Ошибка при завершении сессии",
      });
    }

    logger.info("Сессия успешно завершена");
    res.json({ status: "ok", message: "отменены все предыдущие действия" });
  });
});

module.exports = router;
