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

/**
 * @swagger
 * /api/registration/phone:
 *   post:
 *     summary: Отправка кода подтверждения на телефон
 *     description: |
 *       Отправляет SMS с кодом подтверждения на указанный номер телефона.
 *       Ограничивает частоту запросов - 1 запрос в 60 секунд.
 *       Требует подтверждения телефона для завершения регистрации.
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Номер телефона в формате +7XXXXXXXXXX
 *                 example: "+79161234567"
 *     responses:
 *       200:
 *         description: Успешная отправка кода
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 phoneCount:
 *                   type: integer
 *                   description: Количество оставшихся попыток ввода кода
 *                   example: 3
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "нет нужной информации"
 *       403:
 *         description: Действие недоступно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unavailable"
 *                 message:
 *                   type: string
 *                   example: "нельзя часто отправлять запросы на подтверждение телефона"
 *       409:
 *         description: Телефон уже подтвержден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "телефон уже подтвержден"
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "ошибка отправки кода"
 */

router.post("/phone", async (req, res) => {
  try {
    if (!req.body.phone) {
      logger.error("Отсутствует поле 'phone' в теле запроса");
      return res.json({ status: "error", message: "нет нужной информации" });
    }
    if (req.session.phoneCheck) {
      logger.error("Номер телефона уже подтвержден");
      return res.json({ status: "error", message: "телефон уже подтвержден" });
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
 *     summary: Проверка кода подтверждения телефона
 *     description: |
 *       Проверяет код, отправленный на телефон пользователя.
 *       Если код верный, помечает телефон как подтвержденный.
 *       При неверном коде уменьшает количество оставшихся попыток.
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneCode
 *             properties:
 *               phoneCode:
 *                 type: string
 *                 description: Код подтверждения из SMS
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Телефон успешно подтвержден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "телефон подтвержден"
 *       400:
 *         description: Ошибка в запросе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "нет нужной информации"
 *       403:
 *         description: Телефон уже подтвержден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "телефон уже подтвержден"
 *       410:
 *         description: Закончились попытки ввода кода
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "закончились попытки подтверждения телефона"
 *       418:
 *         description: Неверный код подтверждения
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "неверный код"
 *                 phoneCount:
 *                   type: integer
 *                   example: 2
 *       500:
 *         description: Внутренняя ошибка сервера
 */

router.post("/phonecode", async (req, res) => {
  try {
    if (!req.body.phoneCode) {
      logger.error("Отсутствует поле 'phoneCode' в теле запроса");
      return res.json({ status: "error", message: "нет нужной информации" });
    }
    if (req.session.phoneCheck) {
      // logger.info("Номер телефона уже подтвержден");
      return res.json({ status: "error", message: "телефон уже подтвержден" });
    }
    if (req.session.phoneCount <= 0) {
      logger.warn("Закончились попытки подтверждения телефона");
      req.session.destroy();
      return res.json({
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
 *     summary: Отправка кода подтверждения на email
 *     description: |
 *       Отправляет код подтверждения на указанный email.
 *       Требует предварительного подтверждения телефона.
 *       Ограничивает частоту запросов.
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
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
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 emailcount:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Ошибка в запросе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "нет нужной информации"
 *       403:
 *         description: Email уже подтвержден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "email уже подтвержден"
 *       409:
 *         description: Телефон не подтвержден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "вначале нужно подтвердить телефон"
 *       429:
 *         description: Слишком частые запросы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unavailable"
 *                 message:
 *                   type: string
 *                   example: "нельзя часто отправлять запросы на подтверждение email"
 *       500:
 *         description: Ошибка отправки кода
 */

router.post("/email", async (req, res) => {
  try {
    logger.info(
      `Получен запрос на подтверждение email: ${JSON.stringify(req.body)}`
    );
    if (!req.body.email) {
      logger.error("Отсутствует поле 'email' в теле запроса");
      return res.json({ status: "error", message: "нет нужной информации" });
    }
    if (req.session.emailCheck) {
      // logger.info("Email уже подтвержден");
      return res.json({ status: "error", message: "email уже подтвержден" });
    }
    if (!req.session.phoneCheck) {
      logger.warn("Сначала необходимо подтвердить номер телефона");
      return res.json({
        status: "error",
        message: "вначале нужно подтвердить телефон",
      });
    }
    if (req.session.emailBlock) {
      logger.warn("Слишком частые запросы на подтверждение email");
      return res.json({
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
 *     summary: Проверка кода подтверждения email
 *     description: |
 *       Проверяет код, отправленный на email пользователя.
 *       Если код верный, помечает email как подтвержденный.
 *       При неверном коде уменьшает количество оставшихся попыток.
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailCode
 *             properties:
 *               emailCode:
 *                 type: string
 *                 description: Код подтверждения из email
 *                 example: "ABCD12"
 *     responses:
 *       200:
 *         description: Email успешно подтвержден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "email подтвержден"
 *       400:
 *         description: Ошибка в запросе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "нет нужной информации"
 *       403:
 *         description: Email уже подтвержден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "email уже подтвержден"
 *       410:
 *         description: Закончились попытки ввода кода
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "закончились попытки подтверждения email"
 *       418:
 *         description: Неверный код подтверждения
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "неверный код"
 *                 emailCount:
 *                   type: integer
 *                   example: 2
 *       500:
 *         description: Внутренняя ошибка сервера
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
 *     summary: Создание нового пользователя
 *     description: |
 *       Создает нового пользователя в системе или обновляет существующего.
 *       Требует подтвержденных телефона и email.
 *       Возвращает JWT токен для аутентификации.
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 description: Пароль пользователя
 *                 example: "StrongPassword123"
 *     responses:
 *       200:
 *         description: Пользователь создан/обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 jwt:
 *                   type: string
 *                   description: JWT токен для аутентификации
 *       400:
 *         description: Отсутствует пароль
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "нет нужной информации"
 *       403:
 *         description: Не все данные подтверждены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "не вся информация подтверждена"
 *       500:
 *         description: Ошибка создания/обновления пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "ошибка создания пользователя"
 *                 error:
 *                   type: string
 *                   example: "Detailed error message"
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
 *     summary: Очистка сессии регистрации
 *     description: Уничтожает текущую сессию, отменяя все предыдущие шаги регистрации.
 *     tags: [Registration]
 *     responses:
 *       200:
 *         description: Сессия успешно очищена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "отменены все предыдущие действия"
 *       500:
 *         description: Ошибка при очистке сессии
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Ошибка при завершении сессии"
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
