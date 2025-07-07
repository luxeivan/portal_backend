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
const timeAttempts = 60000; //Время попыток

/**
 * @swagger
 * /api/registration/phone:
 *   post:
 *     summary: Запрос SMS-кода на телефон
 *     tags: ["🌐 Registration"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+79517019281"
 *     responses:
 *       200:
 *         description: Код отправлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:     { type: string, example: ok }
 *                 phoneCount: { type: integer, example: 3 }
 *       400: { description: Нет номера телефона }
 *       403: { description: Телефон уже подтверждён }
 *       429: { description: Повторный запрос слишком рано }
 *       500: { description: Ошибка отправки SMS }
 */

router.post("/phone", async (req, res) => {
  try {
    if (!req.body.phone) {
      logger.error("Отсутствует поле 'phone' в теле запроса");
      return res.status(400).json({ status: "error", message: "нет нужной информации" });
    }
    if (req.session.phoneCheck) {
      logger.error("Номер телефона уже подтвержден");
      return res.status(400).json({ status: "error", message: "телефон уже подтвержден" });
    }
    if (!req.session.emailCheck) {
      logger.warn("Сначала необходимо подтвердить email");
      return res.status(400).json({
        status: "error",
        message: "вначале нужно подтвердить email",
      });
    }

    if (req.session.phoneBlock) {
      logger.error("Запрос на подтверждение телефона отправлен слишком часто");
      return res.json({
        status: "unavailable",
        message: "нельзя часто отправлять запросы на подтверждение телефона",
      });
    }
    req.session.phone = req.body.phone;
    req.session.phoneCheck = false;
    req.session.phoneCount = attempts;
    console.log("смс отправлено")
    const code = await sendCodeToPhone(req.body.phone);
    logger.info(
      `Код подтверждения отправлен на номер телефона: ${req.body.phone}, код: ${code}`
    );

    req.session.phoneBlock = true;
    setTimeout(() => {
      req.session.phoneBlock = false;
    }, timeAttempts);

    req.session.phoneCode = code;

    return res.json({ status: "ok", phoneCount: req.session.phoneCount });
  } catch (error) {
    logger.error(`Ошибка при отправке кода подтверждения: ${error.message}`);
    return res
      .status(500)
      .json({ status: "error", message: "ошибка отправки кода" });
  }
});

/**
 * @swagger
 * /api/registration/phonecode:
 *   post:
 *     summary: Подтвердить SMS-код
 *     tags: ["🌐 Registration"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneCode]
 *             properties:
 *               phoneCode:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       200: { description: Телефон подтверждён }
 *       400: { description: Код не передан }
 *       403: { description: Телефон уже подтверждён }
 *       410: { description: Попытки исчерпаны }
 *       418:
 *         description: Неверный код
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:     { type: string, example: error }
 *                 message:    { type: string, example: "неверный код" }
 *                 phoneCount: { type: integer, example: 2 }
 *       500: { description: Внутренняя ошибка сервера }
 */

router.post("/phonecode", async (req, res) => {
  try {
    if (!req.body.phoneCode) {
      logger.error("Отсутствует поле 'phoneCode' в теле запроса");
      return res.status(400).json({ status: "error", message: "нет нужной информации" });
    }
    if (req.session.phoneCheck) {
      // logger.info("Номер телефона уже подтвержден");
      return res.status(400).json({ status: "error", message: "телефон уже подтвержден" });
    }
    if (req.session.phoneCount <= 0) {
      logger.warn("Закончились попытки подтверждения телефона");
      req.session.destroy();
      return res.status(400).json({
        status: "error",
        message: "закончились попытки подтверждения телефона",
      });
    }
    // logger.info(
    //   `Полученный код: ${req.body.phoneCode}, ожидаемый код: ${req.session.phoneCode}`
    // );
    if (req.body.phoneCode == req.session.phoneCode) {
      req.session.phoneCheck = true;
      req.session.phoneCount = 0;
      // logger.info("Номер телефона подтвержден");
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
  } catch (error) {
    logger.error(`Ошибка при проверке кода подтверждения: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Внутренняя ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/registration/email:
 *   post:
 *     summary: Запрос кода на e-mail
 *     tags: ["🌐 Registration"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Код отправлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:     { type: string, example: ok }
 *                 emailcount: { type: integer, example: 3 }
 *       400: { description: Email не передан }
 *       403: { description: Email уже подтверждён }
 *       409: { description: Телефон ещё не подтверждён }
 *       429: { description: Повторный запрос слишком рано }
 *       500: { description: Ошибка отправки письма }
 */

router.post("/email", async (req, res) => {
  const originDomain = req.get('origin')
  console.log("originDomain", originDomain)

  const host = req.get('host')
  console.log("host", host)

  const userIP = req.socket.remoteAddress;
  console.log("userIP", userIP)
  try {
    logger.info(
      `Получен запрос на подтверждение email: ${JSON.stringify(req.body)}`
    );
    if (!req.body.email) {
      logger.error("Отсутствует поле 'email' в теле запроса");
      return res.status(400).json({ status: "error", message: "нет нужной информации" });
    }
    if (req.session.emailCheck) {
      // logger.info("Email уже подтвержден");
      return res.status(400).json({ status: "error", message: "email уже подтвержден" });
    }

    if (req.session.emailBlock) {
      logger.warn("Слишком частые запросы на подтверждение email");
      return res.status(400).json({
        status: "unavailable",
        message: "нельзя часто отправлять запросы на подтверждение email",
      });
    }

    req.session.email = req.body.email.toLowerCase();
    req.session.emailCheck = false;
    req.session.emailCount = attempts;

    const code = await sendCodeToMail(req.body.email);
    // logger.info(`Код подтверждения отправлен на email: ${req.body.email}`);

    req.session.emailBlock = true;
    setTimeout(() => {
      req.session.emailBlock = false;
    }, timeAttempts);

    req.session.emailCode = code;

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

/**
 * @swagger
 * /api/registration/emailcode:
 *   post:
 *     summary: Подтвердить e-mail код
 *     tags: ["🌐 Registration"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emailCode]
 *             properties:
 *               emailCode:
 *                 type: string
 *                 example: "ABCD12"
 *     responses:
 *       200: { description: Email подтверждён }
 *       400: { description: Код не передан }
 *       403: { description: Email уже подтверждён }
 *       410: { description: Попытки исчерпаны }
 *       418: { description: Неверный код }
 *       500: { description: Внутренняя ошибка сервера }
 */

router.post("/emailcode", async (req, res) => {
  try {
    logger.info(
      `Получен запрос на подтверждение email-кода: ${JSON.stringify(req.body)}`
    );
    if (!req.body.emailCode) {
      logger.error("Отсутствует поле 'emailCode' в теле запроса");
      return res.json({ status: "error", message: "нет нужной информации" });
    }
    if (req.session.emailCheck) {
      // logger.info("Email уже подтвержден");
      return res.json({ status: "error", message: "email уже подтвержден" });
    }
    if (req.session.emailCount == 0) {
      logger.warn("Закончились попытки подтверждения email");
      req.session.destroy();
      return res.json({
        status: "error",
        message: "закончились попытки подтверждения email",
      });
    }
    if (req.body.emailCode == req.session.emailCode) {
      req.session.emailCheck = true;
      req.session.emailCount = 0;
      // logger.info("Email успешно подтвержден");
      return res.json({ status: "ok", message: "email подтвержден" });
    } else {
      req.session.emailCount = req.session.emailCount - 1;
      logger.warn("Неверный код подтверждения email");
      return res.json({
        status: "error",
        message: "неверный код",
        emailCount: req.session.emailCount,
      });
    }
  } catch (error) {
    logger.error(
      `Ошибка при проверке кода подтверждения email: ${error.message}`
    );
    return res.status(500).json({
      status: "error",
      message: "Внутренняя ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/registration/newuser:
 *   post:
 *     summary: Создать нового пользователя
 *     tags: ["🌐 Registration"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 example: StrongPassword123
 *     responses:
 *       200:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 jwt:    { type: string, example: "eyJhbGciOi..." }
 *       400: { description: Пароль не передан }
 *       403: { description: Телефон / e-mail ещё не подтверждены }
 *       500: { description: Ошибка создания / обновления пользователя }
 */

router.post("/newuser", async (req, res) => {
  try {
    logger.info(
      `Получен запрос на создание нового пользователя: ${JSON.stringify(
        req.body
      )}`
    );

    if (!req.body.password) {
      logger.error("Отсутствует поле 'password' в теле запроса");
      return res.json({ status: "error", message: "нет нужной информации" });
    }

    if (!req.session.emailCheck || !req.session.phoneCheck) {
      logger.warn("Не вся информация подтверждена");
      return res.json({
        status: "error",
        message: "не вся информация подтверждена",
      });
    }

    const checkUser = await checkUserByEmail(req.session.email);
    if (checkUser) {
      try {
        const user = await updateUser(
          checkUser,
          req.session.phone,
          req.body.password
        );
        logger.info(`Пользователь найден и обновлен: ${user.Email}`);
        req.session.destroy();
        const userjwt = jwt.sign(
          {
            id: user.Ref_Key,
            // email: user.Email, 
            // phone: user.Phone 
          },
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
      try {
        const newuser = await createNewUser(
          req.session.email,
          req.session.phone,
          req.body.password
        );
        logger.info(`Создан новый пользователь: ${newuser.Email}`);
        req.session.destroy();
        const userjwt = jwt.sign(
          {
            id: newuser.Ref_Key,
            // email: newuser.Email, 
            // phone: newuser.Phone 
          },
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
  } catch (error) {
    logger.error(
      `Общая ошибка при создании/обновлении пользователя: ${error.message}`
    );
    return res.status(500).json({
      status: "error",
      message: "Внутренняя ошибка сервера",
    });
  }
});

/**
 * @swagger
 * /api/registration/clearinfo:
 *   post:
 *     summary: Сбросить текущую сессию регистрации
 *     tags: ["🌐 Registration"]
 *     responses:
 *       200:
 *         description: Сессия очищена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:  { type: string, example: ok }
 *                 message: { type: string, example: "отменены все предыдущие действия" }
 *       500: { description: Ошибка завершения сессии }
 */

router.post("/clearinfo", async (req, res) => {
  try {
    // logger.info("Получен запрос на очистку информации и завершение сессии");

    req.session.destroy((err) => {
      if (err) {
        logger.error(`Ошибка при завершении сессии: ${err.message}`);
        return res.status(500).json({
          status: "error",
          message: "Ошибка при завершении сессии",
        });
      }

      // logger.info("Сессия успешно завершена");
      res.json({ status: "ok", message: "отменены все предыдущие действия" });
    });
  } catch (error) {
    logger.error(`Общая ошибка при завершении сессии: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message: "Внутренняя ошибка сервера",
    });
  }
});

module.exports = router;
