const express = require("express");
const router = express.Router();
const { check, validationResult, checkSchema } = require("express-validator");
const sendCodeToPhone = require("../services/sendCodeToPhone");
const jwt = require("jsonwebtoken");
const { getUserByEmail, getUserById } = require("../services/onec/users");
const logger = require("../logger");
const bcrypt = require("bcrypt");

const privateKey = process.env.JWT_SECRET;
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     description: Проверяет логин/пароль и отправляет код подтверждения на телефон
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 10
 *                 example: StrongPassword123
 *     responses:
 *       200:
 *         description: Код подтверждения отправлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Ошибка валидации или отсутствуют данные
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       418:
 *         description: Неверные учетные данные
 *       500:
 *         description: Внутренняя ошибка сервера
 */

router.post(
  "/login",
  async (req, res, next) => {
    try {
      await checkSchema({
        email: { isEmail: true, errorMessage: "Поле не является Email" },
        password: {
          isLength: { options: { min: 10 } },
          errorMessage: "Пароль не может быть меньше 10 символов",
        },
      }).run(req);
      const result = validationResult(req);
      if (!result.isEmpty()) {
        logger.error(
          "Ошибка проверки полей: %s",
          JSON.stringify(result.errors)
        );
        return res.status(400).json({ status: "error", errors: result.errors });
      }
      next();
    } catch (error) {
      logger.error(
        "Внутренняя ошибка сервера при проверке полей: %s",
        error.message
      );
      res
        .status(500)
        .json({ status: "error", message: "Внутренняя ошибка сервера" });
    }
  },
  async function (req, res) {
    try {
      if (!req.body.email || !req.body.password) {
        return res
          .status(400)
          .json({ status: "error", message: "нет нужной информации" });
      }

      const founduser = await getUserByEmail(req.body.email.toLowerCase());
      // console.log("founduser", founduser);

      if (
        founduser &&
        (await bcrypt.compare(req.body.password, founduser.password))
      ) {
        req.session.founduser = founduser;
        try {
          req.session.pincode = await sendCodeToPhone(founduser.phone);
          return res.json({ status: "ok", message: "Ожидается пин код" });
        } catch (error) {
          logger.error(
            "Ошибка при отправке кода на телефон: %s",
            error.message
          );
          return res
            .status(500)
            .json({ status: "error", message: "Не удалось совершить звонок" });
        }
      } else {
        return res
          .status(418)
          .json({ status: "error", message: "Логин или пароль неверные" });
      }
    } catch (error) {
      logger.error("Ошибка при проверке пользователя: %s", error.message);
      res
        .status(500)
        .json({ status: "error", message: "Внутренняя ошибка сервера" });
    }
  }
);

/**
 * @swagger
 * /api/auth/logincode:
 *   post:
 *     summary: Подтверждение авторизации
 *     description: Проверка кода подтверждения и выдача JWT токена
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pincode
 *             properties:
 *               pincode:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 11
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 jwt:
 *                   type: string
 *                 userid:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *       400:
 *         description: Неверный запрос или пользователь не найден
 *       418:
 *         description: Неверный код подтверждения
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post(
  "/logincode",
  async (req, res, next) => {
    try {
      await checkSchema({
        pincode: {
          isLength: { options: { min: 4, max: 11 } },
          errorMessage: "Код не может быть меньше 4 символов",
        },
      }).run(req);
      const result = validationResult(req);
      if (!result.isEmpty()) {
        logger.error("Ошибка валидации: %s", JSON.stringify(result.errors));
        return res.status(400).json({ status: "error", errors: result.errors });
      }
      next();
    } catch (error) {
      logger.error(
        "Внутренняя ошибка сервера при валидации пинкода: %s",
        error.message
      );
      res
        .status(500)
        .json({ status: "error", message: "Внутренняя ошибка сервера" });
    }
  },
  async (req, res) => {
    try {
      if (!req.body.pincode) {
        logger.error("Ошибка: нет нужной информации");
        return res
          .status(400)
          .json({ status: "error", message: "нет нужной информации" });
      }
      if (!req.session.founduser) {
        logger.error("Ошибка: Не найден пользователь");
        return res
          .status(400)
          .json({ status: "error", message: "Не найден пользователь" });
      }
      if (req.session.pincode == req.body.pincode) {
        const userjwt = jwt.sign(
          {
            id: req.session.founduser.Ref_Key,
            email: req.session.founduser.email,
            phone: req.session.founduser.phone,
          },
          privateKey,
          { expiresIn: `${process.env.JWT_LIVE_HOURS}h` }
        );
        return res.json({
          status: "ok",
          jwt: userjwt,
          userid: req.session.founduser.Ref_key,
          email: req.session.founduser.email,
          phone: req.session.founduser.phone,
        });
      } else {
        logger.error("Ошибка: Не верный пин код");
        return res
          .status(418)
          .json({ status: "error", message: "Не верный пин код" });
      }
    } catch (error) {
      logger.error(
        "Внутренняя ошибка сервера при проверке пинкода: %s",
        error.message
      );
      res
        .status(500)
        .json({ status: "error", message: "Внутренняя ошибка сервера" });
    }
  }
);

/**
 * @swagger
 * /api/auth/checkjwt:
 *   post:
 *     summary: Проверка JWT токена
 *     description: Валидация JWT токена и получение информации о пользователе
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jwt
 *             properties:
 *               jwt:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Токен валиден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *       400:
 *         description: Отсутствует токен
 *       401:
 *         description: Невалидный токен
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/checkjwt", async function (req, res) {
  try {
    if (!req.body.jwt) {
      logger.error("Ошибка: не указан jwt в теле");
      return res.status(400).json("не указан jwt в теле");
    }

    const valid = await jwt.verify(req.body.jwt, privateKey);
    // logger.info("JWT успешно проверен", { valid });
    const user = await getUserById(valid.id);
    if (!user) throw new Error("Пользователь не найден");
    res.json({ id: user.Ref_key, email: user.email, phone: user.phone });
  } catch (error) {
    logger.error("Ошибка проверки JWT", { error: error.message });
    res.status(401).json({ status: "unauthorized" });
  }
});

module.exports = router;
